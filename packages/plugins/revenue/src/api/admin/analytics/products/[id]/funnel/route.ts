import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { buildFunnelFromSnapshots } from "@medusajs/analytics"
import type { AnalyticsVertical } from "../../../../../lib/analytics-overview"
import {
  getTenantId,
  tenantMismatch,
  tenantScopeFilter,
} from "../../../../../lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../../../modules/revenue/types"

const normalizeVertical = (value?: string | null): AnalyticsVertical => {
  if (value === "mobile_game" || value === "web") {
    return value
  }
  return "mobile_app"
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const revenue: any = req.scope.resolve(REVENUE_MODULE)
  const analytics: any = req.scope.resolve(Modules.ANALYTICS)
  const tenantId = getTenantId(req)

  const [app] = await revenue.listApps(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!app || tenantMismatch(req, app)) {
    return res.status(404).json({ message: "Product not found" })
  }

  const vertical = normalizeVertical(app.vertical)
  const snapshots = await analytics.listSnapshotsForProduct(
    tenantId,
    req.params.id,
    1
  )

  const funnelSnapshots = snapshots.filter(
    (s: { metric: string; source: string }) =>
      String(s.metric).startsWith("funnel_step_") &&
      ["levios", "posthog"].includes(s.source)
  )

  const steps = buildFunnelFromSnapshots(vertical, funnelSnapshots)

  res.status(200).json({
    product_id: req.params.id,
    vertical,
    date: funnelSnapshots[0]?.date ?? null,
    steps,
  })
}
