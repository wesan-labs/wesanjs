import { model } from "@medusajs/framework/utils"

// Ürün defteri (oyun/uygulama). Tüm gelir/gider verisi bir app'e atfedilir.
// external_ids: { revenuecat_project_id, admob_app_ids: [], app_store_id?, play_store_id? }
export default model.define(
  { tableName: "revenue_app", name: "App" },
  {
    id: model.id({ prefix: "rapp" }).primaryKey(),
    // Multi-tenant scope (ADR-0001).
    tenant_id: model.text().nullable(),
    name: model.text(),
    status: model.text().default("active"),
    vertical: model.text().default("mobile_app"),
    runtime: model.text().nullable(),
    icon_url: model.text().nullable(),
    external_ids: model.json().nullable(),
    metadata: model.json().nullable(),
  }
)
