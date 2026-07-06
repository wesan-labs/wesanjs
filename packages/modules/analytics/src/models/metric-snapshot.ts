import { model } from "@medusajs/framework/utils"

export default model
  .define(
    { tableName: "analytics_metric_snapshot", name: "AnalyticsMetricSnapshot" },
    {
      id: model.id({ prefix: "asnap" }).primaryKey(),
      tenant_id: model.text().nullable(),
      product_id: model.text(),
      date: model.dateTime(),
      source: model.text(),
      metric: model.text(),
      value: model.bigNumber().default(0),
      dimensions: model.json().nullable(),
    }
  )
  .indexes([
    {
      on: ["tenant_id", "product_id", "date", "source", "metric"],
      unique: true,
    },
  ])
