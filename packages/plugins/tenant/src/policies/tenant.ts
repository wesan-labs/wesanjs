import { definePolicies } from "@medusajs/framework/utils"

// #0014 guvenlik temeli: tenant yonetim uclari icin RBAC policy katalogu.
// Boot'ta policiesLoader plugin'in src/policies dizinini tarar ve bu tanimlar
// rbac modulune otomatik sync olur (migration'siz). Enforcement, rbac feature
// flag'i acikken middlewares.ts'teki `policies` deklarasyonlariyla devreye girer.
export const tenantPolicies = definePolicies([
  {
    name: "ReadTenant",
    resource: "tenant",
    operation: "read",
    description: "Read tenants",
  },
  {
    name: "CreateTenant",
    resource: "tenant",
    operation: "create",
    description: "Create tenants",
  },
  {
    name: "UpdateTenant",
    resource: "tenant",
    operation: "update",
    description: "Update tenants",
  },
  {
    name: "DeleteTenant",
    resource: "tenant",
    operation: "delete",
    description: "Delete tenants",
  },
  {
    name: "ReadTenantMember",
    resource: "tenant_member",
    operation: "read",
    description: "Read tenant members",
  },
  {
    name: "CreateTenantMember",
    resource: "tenant_member",
    operation: "create",
    description: "Add tenant members",
  },
  {
    name: "UpdateTenantMember",
    resource: "tenant_member",
    operation: "update",
    description: "Update tenant members",
  },
  {
    name: "DeleteTenantMember",
    resource: "tenant_member",
    operation: "delete",
    description: "Remove tenant members",
  },
])
