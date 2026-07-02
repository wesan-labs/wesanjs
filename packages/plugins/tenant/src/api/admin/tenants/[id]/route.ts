import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { TENANT_MODULE } from "../../../../modules/tenant"
import type TenantModuleService from "../../../../modules/tenant/service"
import { forbidden, getActorMembership } from "../../../lib/require-membership"

// GET /admin/tenants/:id — tenant + üyeler. Yalnız ÜYELER görebilir
// (security review: üye-olmayana cross-tenant bilgi sızıntısıydı).
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  if (!(await getActorMembership(req, id))) {
    res.status(403).json(forbidden())
    return
  }
  const service: TenantModuleService = req.scope.resolve(TENANT_MODULE)
  const tenant = await service.retrieveTenant(id)
  const memberships = await service.listTenantMemberships({ tenant_id: id })

  // E-postaları tek sorguda getir (N+1 yok). O(m).
  let members: Array<Record<string, unknown>> = memberships
  if (memberships.length) {
    const userService = req.scope.resolve(Modules.USER)
    const users = await userService.listUsers({
      id: memberships.map((m) => m.user_id),
    })
    const emailById = new Map(users.map((u: any) => [u.id, u.email]))
    members = memberships.map((m) => ({
      ...m,
      email: emailById.get(m.user_id) ?? null,
    }))
  }

  res.json({ tenant, members })
}

// POST /admin/tenants/:id — ad/durum güncelle. Yalnız tenant ADMIN'i.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  if (!(await getActorMembership(req, id, "admin"))) {
    res.status(403).json(forbidden())
    return
  }
  const body = req.body as { name?: string; status?: string }
  const service: TenantModuleService = req.scope.resolve(TENANT_MODULE)
  const update: Record<string, unknown> = { id }
  if (body.name !== undefined) {
    update.name = body.name
  }
  if (body.status !== undefined) {
    update.status = body.status
  }
  const tenant = await service.updateTenants(update as any)
  res.json({ tenant })
}
