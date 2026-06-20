import { MedusaContainer } from "@medusajs/framework/types"
import { RevenueCatConnector } from "../modules/revenue/connectors/revenuecat"
import { REVENUE_MODULE } from "../modules/revenue/types"

export default async function syncRevenuecat(container: MedusaContainer) {
  const apiKey = process.env.REVENUECAT_API_KEY
  const projectId = process.env.REVENUECAT_PROJECT_ID
  if (!apiKey || !projectId || apiKey.includes("placeholder")) {
    container.resolve("logger").warn("[revenue] RevenueCat keys missing; skipping sync")
    return
  }
  const connector = new RevenueCatConnector({
    apiKey,
    projectId,
    webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  })
  const metrics = await connector.fetchMetrics()
  const service: any = container.resolve(REVENUE_MODULE)
  const expenses = await service.listExpenses({}, { take: 1000 })
  const expenseTotal = Number(
    expenses.reduce((a: number, e: any) => a + Number(e.amount), 0).toFixed(2)
  )
  await service.upsertDailySnapshot({ date: new Date(), metrics, expenseTotal })
  container.resolve("logger").info(`[revenue] snapshot synced: MRR=${metrics.mrr}`)
}

export const config = {
  name: "revenue-sync-revenuecat",
  schedule: "0 * * * *", // hourly; snapshot keyed by day so it upserts
}
