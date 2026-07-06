import { model } from "@medusajs/framework/utils"

export default model
  .define(
    { tableName: "analytics_event", name: "AnalyticsEvent" },
    {
      id: model.id({ prefix: "aevt" }).primaryKey(),
      tenant_id: model.text().nullable(),
      product_id: model.text(),
      event: model.text(),
      distinct_id: model.text(),
      occurred_at: model.dateTime(),
      properties: model.json().nullable(),
    }
  )
  .indexes([
    {
      on: ["tenant_id", "product_id", "occurred_at"],
    },
    {
      on: ["product_id", "event", "occurred_at"],
    },
  ])
