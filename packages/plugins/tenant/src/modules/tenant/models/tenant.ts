import { model } from "@medusajs/framework/utils"

/**
 * A tenant (customer organization). The multi-tenant spine: every domain table
 * (content, revenue, cms, social…) will carry tenant_id and be RLS-scoped to one
 * of these. status gates access (active|suspended). Enabled modules live in the
 * entitlements layer (#0006), not here — keep the tenant lean.
 */
const Tenant = model.define("tenant", {
  id: model.id().primaryKey(),
  slug: model.text(),
  name: model.text(),
  status: model.text().default("active"),
})

export default Tenant
