import { model } from "@medusajs/framework/utils"
import { RevenueSourceType } from "../types"

export default model.define(
  { tableName: "revenue_source", name: "RevenueSource" },
  {
    id: model.id({ prefix: "rsrc" }).primaryKey(),
    type: model.enum(RevenueSourceType),
    name: model.text(),
    app_id: model.text().nullable(),
    external_id: model.text().nullable(),
    status: model.text().default("active"),
    credentials_ref: model.text().nullable(),
    secret_enc: model.text().nullable(),
    last_synced_at: model.dateTime().nullable(),
    last_cursor: model.text().nullable(),
    last_error: model.text().nullable(),
    metadata: model.json().nullable(),
  }
)
