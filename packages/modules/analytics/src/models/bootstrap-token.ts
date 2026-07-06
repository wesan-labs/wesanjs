import { model } from "@medusajs/framework/utils"

export default model.define(
  { tableName: "analytics_bootstrap_token", name: "AnalyticsBootstrapToken" },
  {
    id: model.id({ prefix: "abtk" }).primaryKey(),
    tenant_id: model.text().nullable(),
    product_id: model.text(),
    token_hash: model.text(),
    token_hint: model.text().nullable(),
    rotated_at: model.dateTime().nullable(),
  }
)
