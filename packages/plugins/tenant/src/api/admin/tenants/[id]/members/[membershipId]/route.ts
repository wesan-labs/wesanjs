import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { TENANT_MODULE } from "../../../../../../modules/tenant"
import type TenantModuleService from "../../../../../../modules/tenant/service"
import { removeTenantMemberWorkflow } from "../../../../../../workflows/manage-membership"
import {
  forbidden,
  getActorMembership,
} from "../../../../../lib/require-membership"

// DELETE /admin/tenants/:id/members/:membershipId — üyeliği kaldır.
// Security review düzeltmeleri: (1) yalnız o tenant'ın ADMIN'i, (2) membership
// gerçekten :id tenant'ına ait olmalı (id ile cross-tenant silme kapandı).
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, membershipId } = req.params
  if (!(await getActorMembership(req, id, "admin"))) {
    res.status(403).json(forbidden())
    return
  }
  const service: TenantModuleService = req.scope.resolve(TENANT_MODULE)
  const membership = await service.retrieveTenantMembership(membershipId)
  if (membership.tenant_id !== id) {
    res.status(404).json({ type: "not_found", title: "Not Found" })
    return
  }
  await removeTenantMemberWorkflow(req.scope).run({
    input: { membership_id: membershipId },
  })
  res.status(200).json({ id: membershipId, deleted: true })
}
