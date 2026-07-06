export type AnalyticsVertical = "mobile_game" | "mobile_app" | "web"

export type AnalyticsProduct = {
  id: string
  name: string
  status: string
  vertical: AnalyticsVertical
  runtime?: string | null
  bootstrap_token_hint?: string | null
}

export type AnalyticsMetricPoint = {
  date: string
  value: number
}

export type AnalyticsOverview = {
  product_id: string
  vertical: AnalyticsVertical
  dau: number
  event_count: number
  crash_count: number
  crash_free_rate: number | null
  dau_trend: AnalyticsMetricPoint[]
  crash_trend: AnalyticsMetricPoint[]
  snapshot_days: number
  engine_ready: boolean
}

export const VERTICAL_LABELS: Record<AnalyticsVertical, string> = {
  mobile_game: "Mobil oyun",
  mobile_app: "Mobil uygulama",
  web: "Web",
}

export const VERTICAL_METRICS: Record<
  AnalyticsVertical,
  { label: string; key: string }[]
> = {
  mobile_game: [
    { label: "DAU", key: "dau" },
    { label: "Oturum", key: "session_count" },
    { label: "Crash-free", key: "crash_free_rate" },
  ],
  mobile_app: [
    { label: "DAU", key: "dau" },
    { label: "Onboarding", key: "onboarding_complete" },
    { label: "Crash-free", key: "crash_free_rate" },
  ],
  web: [
    { label: "Ziyaretçi", key: "dau" },
    { label: "Sayfa görüntüleme", key: "pageview" },
    { label: "Crash-free", key: "crash_free_rate" },
  ],
}

type SnapshotRow = {
  date: Date | string
  source: string
  metric: string
  value: number | string
}

const dayKey = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().slice(0, 10)
}

const num = (value: number | string | undefined) =>
  value === undefined ? 0 : Number(value)

const latestMetric = (
  rows: SnapshotRow[],
  source: string,
  metric: string
) => {
  const filtered = rows.filter(
    (r) => r.source === source && r.metric === metric
  )
  if (!filtered.length) {
    return 0
  }
  const last = filtered[filtered.length - 1]
  return num(last.value)
}

const trendFor = (rows: SnapshotRow[], source: string, metric: string) => {
  const byDay = new Map<string, number>()
  for (const row of rows) {
    if (row.source !== source || row.metric !== metric) {
      continue
    }
    byDay.set(dayKey(row.date), num(row.value))
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

const SOURCES = ["levios", "posthog", "glitchtip"] as const

const latestMetricAny = (
  rows: SnapshotRow[],
  metric: string
) => {
  for (const source of SOURCES) {
    const v = latestMetric(rows, source, metric)
    if (v > 0 || rows.some((r) => r.source === source && r.metric === metric)) {
      return v
    }
  }
  return 0
}

const trendForAny = (rows: SnapshotRow[], metric: string) => {
  for (const source of SOURCES) {
    const trend = trendFor(rows, source, metric)
    if (trend.length) {
      return trend
    }
  }
  return []
}

export const buildAnalyticsOverview = (
  productId: string,
  vertical: AnalyticsVertical,
  snapshots: SnapshotRow[]
): AnalyticsOverview => {
  const dau = latestMetricAny(snapshots, "dau")
  const eventCount = latestMetricAny(snapshots, "event_count")
  const crashCount = latestMetricAny(snapshots, "crash_count")
  const crashFreeRaw = SOURCES.map((s) =>
    snapshots.find((r) => r.source === s && r.metric === "crash_free_rate")
  ).find(Boolean)
  const crashFreeRate = crashFreeRaw ? num(crashFreeRaw.value) : null

  return {
    product_id: productId,
    vertical,
    dau,
    event_count: eventCount,
    crash_count: crashCount,
    crash_free_rate: crashFreeRate,
    dau_trend: trendForAny(snapshots, "dau"),
    crash_trend: trendForAny(snapshots, "crash_count"),
    snapshot_days: snapshots.length ? 30 : 0,
    engine_ready: true,
  }
}
