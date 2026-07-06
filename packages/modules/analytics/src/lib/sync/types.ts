export type DayMetric = {
  source: "levios" | "posthog" | "glitchtip"
  metric: string
  value: number
  dimensions?: Record<string, unknown> | null
}

export type ProductRef = {
  id: string
  tenant_id?: string | null
  vertical?: string | null
  name: string
}

export const isAnalyticsDemoMode = () =>
  process.env.ANALYTICS_SYNC_DEMO === "1" ||
  process.env.ANALYTICS_SYNC_DEMO === "true"

export const utcDay = (date: Date) => {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export const daysBack = (count: number) => {
  const days: Date[] = []
  const today = utcDay(new Date())
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    days.push(d)
  }
  return days
}

export const seedBuiltinSnapshots = (
  product: ProductRef,
  day: Date,
  dayIndex: number
): DayMetric[] => {
  const seed = product.id.charCodeAt(product.id.length - 1) + dayIndex
  const dau = 40 + (seed % 80) + Math.floor(dayIndex * 1.2)
  const events = dau * (3 + (seed % 4))
  const crashes = Math.max(0, Math.floor(dau * 0.02) + (seed % 3) - 1)
  const sessions = dau * (2 + (seed % 2))
  const crashFree =
    sessions > 0 ? Math.max(0, 1 - crashes / sessions) : null

  const funnelBase = Math.floor(dau * 0.9)
  const steps: Array<[string, number]> =
    product.vertical === "mobile_game"
      ? [
          ["funnel_step_install", funnelBase],
          ["funnel_step_tutorial", Math.floor(funnelBase * 0.72)],
          ["funnel_step_level_1", Math.floor(funnelBase * 0.48)],
        ]
      : product.vertical === "web"
        ? [
            ["funnel_step_landing", funnelBase],
            ["funnel_step_signup", Math.floor(funnelBase * 0.35)],
            ["funnel_step_checkout", Math.floor(funnelBase * 0.12)],
          ]
        : [
            ["funnel_step_open", funnelBase],
            ["funnel_step_onboarding", Math.floor(funnelBase * 0.65)],
            ["funnel_step_subscribe", Math.floor(funnelBase * 0.18)],
          ]

  return [
    { source: "levios", metric: "dau", value: dau },
    { source: "levios", metric: "event_count", value: events },
    ...steps.map(([metric, value]) => ({
      source: "levios" as const,
      metric,
      value,
    })),
    { source: "levios", metric: "crash_count", value: crashes },
    ...(crashFree !== null
      ? [
          {
            source: "levios" as const,
            metric: "crash_free_rate",
            value: crashFree,
          },
        ]
      : []),
  ]
}
