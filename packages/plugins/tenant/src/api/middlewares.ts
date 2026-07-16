import {
  defineMiddlewares,
  type AuthenticatedMedusaRequest,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { TENANT_MODULE } from "../modules/tenant"
import type TenantModuleService from "../modules/tenant/service"
import { resolveTenantRbacRoleIds } from "./lib/resolve-tenant-rbac-roles"

/** Tenant context fields set by tenant middleware on authenticated admin requests. */
export type AuthenticatedTenantRequest = AuthenticatedMedusaRequest & {
  tenant_id?: string
  tenant_role?: string
  /** Set when x-tenant-id is present; empty array = deny module APIs. */
  tenant_rbac_role_ids?: string[]
}

// A1 tenant context: `x-tenant-id` başlığı → üyelik doğrulaması → req'e tenant bağla.
// Başlık yoksa geç (tek-tenant/legacy mod — geriye uyum). Başlık var ama kullanıcı
// o tenant'ın üyesi değilse 403 (deny). Diğer plugin'ler (cms vb.) req.tenant_id okur.
// Time: O(1) sorgu/istek (unique index'li membership lookup).
async function tenantContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const tenantId = (req.headers["x-tenant-id"] as string | undefined)?.trim()
  if (!tenantId) {
    return next()
  }

  const actorId = (req as any).auth_context?.actor_id as string | undefined
  if (!actorId) {
    // Auth'suz admin isteği zaten auth katmanında düşer; buraya gelirse deny.
    res.status(401).json({
      type: "unauthorized",
      title: "Unauthorized",
      detail: "tenant context requires an authenticated actor",
    })
    return
  }

  const service = req.scope.resolve<TenantModuleService>(TENANT_MODULE)
  const [membership] = await service.listTenantMemberships({
    tenant_id: tenantId,
    user_id: actorId,
  })

  if (!membership) {
    res.status(403).json({
      type: "forbidden",
      title: "Forbidden",
      detail: "actor is not a member of the requested tenant",
      tenant_id: tenantId,
    })
    return
  }

  ;(req as AuthenticatedTenantRequest).tenant_id = tenantId
  ;(req as AuthenticatedTenantRequest).tenant_role = membership.role

  const globalRoleIds =
    ((req as AuthenticatedMedusaRequest).auth_context?.app_metadata
      ?.roles as string[] | undefined) ?? []

  ;(req as AuthenticatedTenantRequest).tenant_rbac_role_ids =
    resolveTenantRbacRoleIds(membership, { globalRoleIds })
  return next()
}

// #0014: tenant yönetim mutasyonları RBAC policy'li (rbac flag'i açıkken enforce).
// Okuma uçları (GET) bilinçli policy'siz — handler'daki üyelik kontrolü zaten
// scope'luyor ve tenant switcher her üye için çalışmalı. In-handler admin-rol
// kontrolleri primary katman olarak kalır; bu deklarasyonlar defense-in-depth.
// NOT: self-serve signup (ADR-0004 A4) geldiğinde `tenant:create` politikası
// signup akışının service-level çağrısıyla yeniden değerlendirilecek.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [tenantContext],
    },
    {
      matcher: "/admin/tenants",
      method: ["POST"],
      policies: [{ resource: "tenant", operation: "create" }],
    },
    {
      matcher: "/admin/tenants/:id",
      method: ["POST"],
      policies: [{ resource: "tenant", operation: "update" }],
    },
    {
      matcher: "/admin/tenants/:id/members",
      method: ["POST"],
      policies: [{ resource: "tenant_member", operation: "create" }],
    },
    {
      matcher: "/admin/tenants/:id/members/:membershipId",
      method: ["PATCH"],
      policies: [{ resource: "tenant_member", operation: "update" }],
    },
    {
      matcher: "/admin/tenants/:id/members/:membershipId",
      method: ["DELETE"],
      policies: [{ resource: "tenant_member", operation: "delete" }],
    },
  ],
})
