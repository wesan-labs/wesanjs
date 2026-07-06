import { model } from "@medusajs/framework/utils"

/** Per-tenant integration row — social profile id, optional BYOK secrets. */
const ContentConnection = model.define("content_connection", {
  id: model.id({ prefix: "cconn" }).primaryKey(),
  tenant_id: model.text(),
  provider: model.text(),
  category: model.text().default("social"),
  config: model.json().nullable(),
  secret_enc: model.text().nullable(),
})

export default ContentConnection
