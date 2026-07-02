import type { MedusaRequest } from "@medusajs/framework/http"
import { TENANT_MODULE } from "../../modules/tenant"
import type TenantModuleService from "../../modules/tenant/service"

// Kontrol-düzlemi yetkilendirme (security review düzeltmesi):
// - membership(req, tenantId)          → aktör o tenant'ın üyesi mi (okuma)
// - membership(req, tenantId, "admin") → aktör o tenant'ta admin mi (mutasyon)
// Dönen null = yetki yok (route 403 üretir). Tam RBAC enforcement A3'te bu
// helper'ın yerine geçer/genişler.
export const getActorMembership = async (
  req: MedusaRequest,
  tenantId: string,
  requiredRole?: "admin"
) => {
  const actorId = (req as any).auth_context?.actor_id as string | undefined
  if (!actorId) {
    return null
  }
  const service = req.scope.resolve<TenantModuleService>(TENANT_MODULE)
  const [membership] = await service.listTenantMemberships({
    tenant_id: tenantId,
    user_id: actorId,
  })
  if (!membership) {
    return null
  }
  if (requiredRole && membership.role !== requiredRole) {
    return null
  }
  return membership
}

export const forbidden = () => ({
  type: "forbidden",
  title: "Forbidden",
  detail: "bu tenant üzerinde yetkin yok",
})
