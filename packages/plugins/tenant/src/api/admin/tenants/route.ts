import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { TENANT_MODULE } from "../../../modules/tenant"
import type TenantModuleService from "../../../modules/tenant/service"
import {
  createTenantWorkflow,
  type CreateTenantInput,
} from "../../../workflows/create-tenant"

// GET /admin/tenants — AKTÖRÜN üyesi olduğu tenant'lar + üye sayıları.
// Security review: tüm tenant'ları listelemek cross-tenant bilgi sızıntısıydı;
// self-service model = herkes yalnız kendi tenant'larını görür.
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
  const mine = await service.listTenantMemberships({ user_id: actorId })
  if (!mine.length) {
    res.json({ tenants: [], count: 0 })
    return
  }
  const ids = mine.map((m) => m.tenant_id)
  const membershipByTenant = new Map(mine.map((m) => [m.tenant_id, m]))
  const tenants = await service.listTenants(
    { id: ids },
    { order: { created_at: "DESC" } }
  )
  // Üye sayıları — yalnız aktörün tenant'ları için, tek sorgu (N+1 yok). O(t+m).
  const memberships = await service.listTenantMemberships(
    { tenant_id: ids },
    { select: ["tenant_id"] }
  )
  const counts = new Map<string, number>()
  for (const m of memberships) {
    counts.set(m.tenant_id, (counts.get(m.tenant_id) ?? 0) + 1)
  }
  res.json({
    tenants: tenants.map((t) => {
      const membership = membershipByTenant.get(t.id)
      return {
        ...t,
        member_count: counts.get(t.id) ?? 0,
        role: membership?.role ?? null,
        rbac_role_id: membership?.rbac_role_id ?? null,
      }
    }),
    count: tenants.length,
  })
}

// POST /admin/tenants — yeni tenant (workflow'lu; oluşturan aktör ilk üye).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = req.body as Pick<CreateTenantInput, "slug" | "name">
  const actorId = (req as any).auth_context?.actor_id as string | undefined
  const { result } = await createTenantWorkflow(req.scope).run({
    input: { ...body, owner_user_id: actorId ?? null },
  })
  res.status(200).json({ tenant: result })
}
