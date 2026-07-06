import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  buildAnalyticsOverview,
  type AnalyticsVertical,
} from "../../../lib/analytics-overview"
import {
  getTenantId,
  tenantMismatch,
  tenantScopeFilter,
} from "../../../lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

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
  const productId = z.string().min(1).parse(req.query.product_id)
  const revenue: any = req.scope.resolve(REVENUE_MODULE)
  const analytics: any = req.scope.resolve(Modules.ANALYTICS)
  const tenantId = getTenantId(req)

  const [app] = await revenue.listApps(
    tenantScopeFilter(req, { id: productId }),
    { take: 1 }
  )
  if (!app || tenantMismatch(req, app)) {
    return res.status(404).json({ message: "Product not found" })
  }

  const snapshots = await analytics.listSnapshotsForProduct(
    tenantId,
    productId,
    30
  )

  const overview = buildAnalyticsOverview(
    productId,
    normalizeVertical(app.vertical),
    snapshots
  )

  res.status(200).json({ overview })
}
