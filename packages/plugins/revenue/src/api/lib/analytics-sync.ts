import { Modules } from "@medusajs/framework/utils"
import { runAnalyticsSync } from "@medusajs/analytics"
import { REVENUE_MODULE } from "../../modules/revenue/types"

export type { AnalyticsSyncResult } from "@medusajs/analytics"

export async function syncAnalyticsSnapshots(
  container: any,
  options?: { tenantId?: string; days?: number }
) {
  const revenue: any = container.resolve(REVENUE_MODULE)
  const analytics: any = container.resolve(Modules.ANALYTICS)
  const logger = container.resolve("logger")

  return runAnalyticsSync(
    {
      listProducts: async (tenantId) => {
        const filter = tenantId ? { tenant_id: tenantId } : {}
        const apps = await revenue.listApps(filter, {
          order: { name: "ASC" },
          take: 500,
        })
        return apps.map((app: any) => ({
          id: app.id,
          tenant_id: app.tenant_id,
          vertical: app.vertical,
          name: app.name,
        }))
      },
      listEventsForDay: (tenantId, productId, day) =>
        analytics.listEventsForDay(tenantId, productId, day),
      recordDayMetrics: (tenantId, productId, day, metrics) =>
        analytics.recordDayMetrics(tenantId, productId, day, metrics),
      log: logger,
    },
    options
  )
}
