import { getHostedGlitchtip } from "../platform-config"
import type { DayMetric } from "./types"

const glitchtipConfig = () => {
  const gt = getHostedGlitchtip()
  if (!gt) {
    return { ready: false as const }
  }
  return {
    ready: true as const,
    baseUrl: gt.apiUrl.replace(/\/$/, ""),
    token: gt.authToken,
    org: gt.orgSlug,
  }
}

const glitchtipFetch = async (path: string) => {
  const cfg = glitchtipConfig()
  if (!cfg.ready) {
    return null
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GlitchTip API failed (${res.status}): ${text}`)
  }

  return res.json()
}

export const isGlitchtipSyncReady = () => glitchtipConfig().ready

export const fetchGlitchtipDayMetrics = async (
  productId: string,
  day: Date
): Promise<DayMetric[]> => {
  if (!glitchtipConfig().ready) {
    return []
  }

  const { org } = glitchtipConfig()
  const dayStr = day.toISOString().slice(0, 10)
  const since = `${dayStr}T00:00:00`
  const until = `${dayStr}T23:59:59`

  const stats = (await glitchtipFetch(
    `/api/0/organizations/${org}/stats_v2/?` +
      new URLSearchParams({
        field: "sum(quantity)",
        project: productId,
        category: "error",
        start: since,
        end: until,
        interval: "1d",
      }).toString()
  )) as { intervals?: Array<{ value: number }> } | null

  const crashCount = stats?.intervals?.[0]?.value ?? 0

  const sessionStats = (await glitchtipFetch(
    `/api/0/organizations/${org}/stats_v2/?` +
      new URLSearchParams({
        field: "sum(quantity)",
        project: productId,
        category: "session",
        start: since,
        end: until,
        interval: "1d",
      }).toString()
  )) as { intervals?: Array<{ value: number }> } | null

  const sessions = sessionStats?.intervals?.[0]?.value ?? 0
  const crashFreeRate =
    sessions > 0 ? Math.max(0, 1 - crashCount / sessions) : null

  const metrics: DayMetric[] = [
    { source: "glitchtip", metric: "crash_count", value: crashCount },
  ]

  if (crashFreeRate !== null) {
    metrics.push({
      source: "glitchtip",
      metric: "crash_free_rate",
      value: crashFreeRate,
    })
  }

  return metrics
}
