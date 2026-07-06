import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  getTenantId,
  tenantMismatch,
  tenantScopeFilter,
} from "../../../../../lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../../../modules/revenue/types"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const revenue: any = req.scope.resolve(REVENUE_MODULE)
  const analytics: any = req.scope.resolve(Modules.ANALYTICS)
  const tenantId = getTenantId(req)

  const [existing] = await revenue.listApps(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!existing || tenantMismatch(req, existing)) {
    return res.status(404).json({ message: "Product not found" })
  }

  const { token, hint } = await analytics.rotateBootstrapToken(
    tenantId,
    req.params.id
  )

  res.status(200).json({
    token,
    hint,
    config_url: "/analytics/v1/config",
  })
}
