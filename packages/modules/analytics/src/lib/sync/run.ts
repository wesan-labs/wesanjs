import {
  daysBack,
  utcDay,
  type DayMetric,
  type ProductRef,
} from "./types"
import { aggregateEventsToDayMetrics } from "./aggregate"
import { fetchPosthogDayMetrics, isPosthogSyncReady } from "./posthog"
import { fetchGlitchtipDayMetrics, isGlitchtipSyncReady } from "./glitchtip"
import { isBuiltinMode, isHostedMode } from "../platform-config"

export type AnalyticsSyncResult = {
  products: number
  days: number
  metrics_written: number
  mode: "builtin" | "hosted"
  skipped: number
}

type SyncDeps = {
  listProducts: (tenantId?: string) => Promise<ProductRef[]>
  listEventsForDay: (
    tenantId: string | undefined,
    productId: string,
    day: Date
  ) => Promise<Array<{ event: string; distinct_id: string }>>
  recordDayMetrics: (
    tenantId: string | undefined,
    productId: string,
    day: Date,
    metrics: DayMetric[]
  ) => Promise<void>
  log: {
    info: (msg: string) => void
    warn: (msg: string) => void
  }
}

const collectDayMetrics = async (
  deps: SyncDeps,
  product: ProductRef,
  day: Date
): Promise<DayMetric[]> => {
  if (isBuiltinMode()) {
    const events = await deps.listEventsForDay(
      product.tenant_id ?? undefined,
      product.id,
      utcDay(day)
    )
    if (!events.length) {
      return []
    }
    return aggregateEventsToDayMetrics(events)
  }

  if (isHostedMode()) {
    const [posthog, glitchtip] = await Promise.all([
      isPosthogSyncReady()
        ? fetchPosthogDayMetrics(product.id, day)
        : Promise.resolve([]),
      isGlitchtipSyncReady()
        ? fetchGlitchtipDayMetrics(product.id, day)
        : Promise.resolve([]),
    ])
    return [...posthog, ...glitchtip]
  }

  return []
}

export async function runAnalyticsSync(
  deps: SyncDeps,
  options?: { tenantId?: string; days?: number }
): Promise<AnalyticsSyncResult> {
  const days = options?.days ?? (isBuiltinMode() ? 14 : 1)
  const dayList = daysBack(days)
  const apps = await deps.listProducts(options?.tenantId)

  let metricsWritten = 0
  let skipped = 0

  for (const product of apps) {
    for (let i = 0; i < dayList.length; i++) {
      const day = dayList[i]
      let metrics: DayMetric[] = []

      try {
        metrics = await collectDayMetrics(deps, product, day)
      } catch (e) {
        deps.log.warn(
          `[analytics] sync skip ${product.id} ${day.toISOString().slice(0, 10)}: ${
            e instanceof Error ? e.message : String(e)
          }`
        )
        skipped++
        continue
      }

      if (!metrics.length) {
        skipped++
        continue
      }

      await deps.recordDayMetrics(
        product.tenant_id ?? undefined,
        product.id,
        utcDay(day),
        metrics
      )
      metricsWritten += metrics.length
    }
  }

  const mode = isBuiltinMode() ? "builtin" : "hosted"
  const result: AnalyticsSyncResult = {
    products: apps.length,
    days: dayList.length,
    metrics_written: metricsWritten,
    mode,
    skipped,
  }

  deps.log.info(`[analytics] sync done: ${JSON.stringify(result)}`)
  return result
}
