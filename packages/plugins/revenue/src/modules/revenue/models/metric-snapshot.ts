import { model } from "@medusajs/framework/utils"

export default model
  .define(
    { tableName: "revenue_metric_snapshot", name: "MetricSnapshot" },
    {
      id: model.id({ prefix: "rsnap" }).primaryKey(),
      date: model.dateTime(),
      app_id: model.text().nullable(),
      source_type: model.text().nullable(),
      mrr: model.bigNumber().default(0),
      active_subscriptions: model.number().default(0),
      active_trials: model.number().default(0),
      new_customers: model.number().default(0),
      active_users: model.number().default(0),
      gross_revenue: model.bigNumber().default(0),
      net_revenue: model.bigNumber().default(0),
      ad_revenue: model.bigNumber().default(0),
      expense_total: model.bigNumber().default(0),
      net_profit: model.bigNumber().default(0),
      currency: model.text(),
    }
  )
  .indexes([{ on: ["date", "app_id", "source_type"], unique: true }])
