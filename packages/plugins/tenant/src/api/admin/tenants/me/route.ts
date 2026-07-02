import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { TENANT_MODULE } from "../../../../modules/tenant"
import type TenantModuleService from "../../../../modules/tenant/service"

// GET /admin/tenants/me — aktörün üye olduğu tenant'lar (tenant-switcher besler).
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = (req as any).auth_context?.actor_id as string | undefined
  if (!actorId) {
    res.status(401).json({ type: "unauthorized", title: "Unauthorized" })
    return
  }
  const service: TenantModuleService = req.scope.resolve(TENANT_MODULE)
  const memberships = await service.listTenantMemberships({
    user_id: actorId,
  })
  if (!memberships.length) {
    res.json({ tenants: [] })
    return
  }
  const tenants = await service.listTenants({
    id: memberships.map((m) => m.tenant_id),
  })
  const roleByTenant = new Map(memberships.map((m) => [m.tenant_id, m.role]))
  res.json({
    tenants: tenants.map((t) => ({
      ...t,
      role: roleByTenant.get(t.id) ?? null,
    })),
  })
}
