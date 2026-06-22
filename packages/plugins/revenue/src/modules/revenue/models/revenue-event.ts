import { model } from "@medusajs/framework/utils"
import { RevenueEventKind, RevenueSourceType } from "../types"

export default model
  .define(
    { tableName: "revenue_event", name: "RevenueEvent" },
    {
      id: model.id({ prefix: "revt" }).primaryKey(),
      source_id: model.text(),
      source_type: model.enum(RevenueSourceType),
      external_id: model.text(),
      app_id: model.text().nullable(),
      platform: model.text().nullable(),
      kind: model.enum(RevenueEventKind),
      status: model.text().default("completed"),
      gross_amount: model.bigNumber(),
      net_amount: model.bigNumber().nullable(),
      currency: model.text(),
      reporting_amount: model.bigNumber().nullable(),
      fx_rate: model.bigNumber().nullable(),
      occurred_at: model.dateTime(),
      raw_payload: model.json().nullable(),
    }
  )
  .indexes([
    { on: ["source_id", "external_id"], unique: true },
    { on: ["occurred_at"] },
    { on: ["kind"] },
  ])
