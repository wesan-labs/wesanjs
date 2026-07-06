import { getHostedPosthog } from "../platform-config"
import type { DayMetric } from "./types"

type HogqlRow = Record<string, unknown>

const posthogConfig = () => {
  const ph = getHostedPosthog()
  if (!ph) {
    return { ready: false as const }
  }
  return {
    ready: true as const,
    host: ph.host,
    apiKey: ph.personalApiKey,
    projectId: ph.projectId,
  }
}

const hogqlQuery = async (query: string): Promise<HogqlRow[]> => {
  const cfg = posthogConfig()
  if (!cfg.ready) {
    return []
  }

  const res = await fetch(`${cfg.host}/api/projects/${cfg.projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { kind: "HogQLQuery", query },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostHog query failed (${res.status}): ${text}`)
  }

  const body = (await res.json()) as {
    results?: HogqlRow[]
    columns?: string[]
  }

  if (!body.results?.length) {
    return []
  }

  const cols = body.columns ?? Object.keys(body.results[0] ?? {})
  return body.results.map((row) => {
    if (Array.isArray(row)) {
      return Object.fromEntries(cols.map((c, i) => [c, row[i]]))
    }
    return row
  })
}

const num = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export const isPosthogSyncReady = () => posthogConfig().ready

export const fetchPosthogDayMetrics = async (
  productId: string,
  day: Date
): Promise<DayMetric[]> => {
  if (!posthogConfig().ready) {
    return []
  }

  const dayStr = day.toISOString().slice(0, 10)
  const metrics: DayMetric[] = []

  const dauRows = await hogqlQuery(`
    SELECT count(DISTINCT person_id) AS value
    FROM events
    WHERE toDate(timestamp) = toDate('${dayStr}')
      AND properties.product_id = '${productId}'
  `)
  metrics.push({
    source: "posthog",
    metric: "dau",
    value: num(dauRows[0]?.value),
  })

  const eventRows = await hogqlQuery(`
    SELECT count() AS value
    FROM events
    WHERE toDate(timestamp) = toDate('${dayStr}')
      AND properties.product_id = '${productId}'
  `)
  metrics.push({
    source: "posthog",
    metric: "event_count",
    value: num(eventRows[0]?.value),
  })

  const funnelRows = await hogqlQuery(`
    SELECT event AS step, count() AS value
    FROM events
    WHERE toDate(timestamp) = toDate('${dayStr}')
      AND properties.product_id = '${productId}'
      AND event LIKE 'funnel_step_%'
    GROUP BY event
    ORDER BY value DESC
    LIMIT 20
  `)

  for (const row of funnelRows) {
    const step = String(row.step ?? "")
    if (!step.startsWith("funnel_step_")) {
      continue
    }
    metrics.push({
      source: "posthog",
      metric: step,
      value: num(row.value),
    })
  }

  return metrics
}
