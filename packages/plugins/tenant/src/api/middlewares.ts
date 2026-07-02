import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { TENANT_MODULE } from "../modules/tenant"
import type TenantModuleService from "../modules/tenant/service"

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

  ;(req as any).tenant_id = tenantId
  ;(req as any).tenant_role = membership.role
  return next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [tenantContext],
    },
  ],
})
