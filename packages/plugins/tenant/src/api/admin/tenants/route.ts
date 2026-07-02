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

// GET /admin/tenants — tenant listesi + üye sayıları (kontrol düzlemi).
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: TenantModuleService = req.scope.resolve(TENANT_MODULE)
  const [tenants, count] = await service.listAndCountTenants(
    {},
    { order: { created_at: "DESC" } }
  )
  // Üye sayıları — tek sorguda topla (N+1 yok). O(t + m).
  const memberships = await service.listTenantMemberships(
    {},
    { select: ["tenant_id"] }
  )
  const counts = new Map<string, number>()
  for (const m of memberships) {
    counts.set(m.tenant_id, (counts.get(m.tenant_id) ?? 0) + 1)
  }
  res.json({
    tenants: tenants.map((t) => ({
      ...t,
      member_count: counts.get(t.id) ?? 0,
    })),
    count,
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
