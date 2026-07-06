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
  // Org admin actions: admin | manager | member
  role: model.text().default("admin"),
  // Module RBAC role for this org (#0007). When set, overrides global user roles
  // for requests scoped with x-tenant-id.
  rbac_role_id: model.text().nullable(),
})

export default TenantMembership
