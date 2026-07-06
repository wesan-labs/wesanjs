import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  tenantMismatch,
  tenantScopeFilter,
  getTenantId,
} from "../../../../lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../../modules/revenue/types"

const PatchProduct = z.object({
  vertical: z.enum(["mobile_game", "mobile_app", "web"]).optional(),
  runtime: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
})

export const PATCH = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = PatchProduct.parse(req.body)
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

  const app = await revenue.updateApps({ id: req.params.id, ...body })

  res.status(200).json({
    product: {
      id: app.id,
      name: app.name,
      status: app.status,
      vertical: app.vertical ?? "mobile_app",
      runtime: app.runtime ?? null,
      bootstrap_token_hint: await analytics.getBootstrapHint(tenantId, app.id),
    },
  })
}
