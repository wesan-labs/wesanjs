import { model } from "@medusajs/framework/utils"

/**
 * Which Medusa user belongs to which tenant, and with which role. A user can
 * belong to multiple tenants with different roles. `role` is the RBAC role key
 * (admin | manager | social | developer …) — wired to @medusajs/rbac in #0007.
 */
const TenantMembership = model.define("tenant_membership", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  user_id: model.text(),
  role: model.text().default("admin"),
})

export default TenantMembership
