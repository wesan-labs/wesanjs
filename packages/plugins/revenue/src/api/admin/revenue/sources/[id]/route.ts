import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  tenantMismatch,
  tenantScopeFilter,
} from "../../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../../modules/revenue/types"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const [existing] = await service.listRevenueSources(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!existing || tenantMismatch(req, existing)) {
    return res.status(404).json({ message: "Source not found" })
  }
  await service.deleteRevenueSources(req.params.id)
  res.status(200).json({ id: req.params.id, object: "source", deleted: true })
}
