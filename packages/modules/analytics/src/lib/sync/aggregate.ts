import type { DayMetric } from "./types"

type EventRow = {
  event: string
  distinct_id: string
}

export const aggregateEventsToDayMetrics = (
  events: EventRow[]
): DayMetric[] => {
  if (!events.length) {
    return []
  }

  const distinct = new Set<string>()
  let crashCount = 0

  for (const row of events) {
    distinct.add(row.distinct_id)
    if (
      row.event === "crash" ||
      row.event === "error" ||
      row.event.startsWith("crash_")
    ) {
      crashCount++
    }
  }

  const funnelCounts = new Map<string, number>()
  for (const row of events) {
    if (row.event.startsWith("funnel_step_")) {
      funnelCounts.set(row.event, (funnelCounts.get(row.event) ?? 0) + 1)
    }
  }

  const dau = distinct.size
  const sessions = Math.max(dau, Math.floor(events.length / 3))
  const crashFree =
    sessions > 0 ? Math.max(0, 1 - crashCount / sessions) : null

  const metrics: DayMetric[] = [
    { source: "levios", metric: "dau", value: dau },
    { source: "levios", metric: "event_count", value: events.length },
    ...Array.from(funnelCounts.entries()).map(([metric, value]) => ({
      source: "levios" as const,
      metric,
      value,
    })),
    { source: "levios", metric: "crash_count", value: crashCount },
  ]

  if (crashFree !== null) {
    metrics.push({
      source: "levios",
      metric: "crash_free_rate",
      value: crashFree,
    })
  }

  return metrics
}
