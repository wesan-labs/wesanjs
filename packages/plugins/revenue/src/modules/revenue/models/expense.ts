import { model } from "@medusajs/framework/utils"
import { ExpenseCategory } from "../types"

export default model.define(
  { tableName: "revenue_expense", name: "Expense" },
  {
    id: model.id({ prefix: "rexp" }).primaryKey(),
    tenant_id: model.text().nullable(),
    app_id: model.text().nullable(),
    category: model.enum(ExpenseCategory).default(ExpenseCategory.OTHER),
    description: model.text(),
    vendor: model.text().nullable(),
    invoice_number: model.text().nullable(),
    invoice_url: model.text().nullable(),
    amount: model.bigNumber(),
    currency: model.text(),
    reporting_amount: model.bigNumber().nullable(),
    occurred_at: model.dateTime(),
    recurring: model.boolean().default(false),
    created_by: model.text().nullable(),
  }
)
