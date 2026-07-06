import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { RevenueCatConnector } from "../../../../modules/revenue/connectors/revenuecat"
import { rateTo } from "../../../../modules/revenue/lib/fx"
import { computeMonthlyReport } from "../../../../modules/revenue/lib/report"
import { tenantScopeFilter } from "../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

// GET /admin/revenue/report?month=YYYY-MM&currency=EUR
// Aylık P&L: gelir(abonelik) − [sabit gider + ayın ekstraları], FX normalize.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const month =
    (req.query.month as string) || new Date().toISOString().slice(0, 7)
  const reportingCurrency = (
    (req.query.currency as string) || "USD"
  ).toUpperCase()

  // Gelir: RevenueCat günlük gelir serisini ayın günlerine göre topla (USD).
  const connector = new RevenueCatConnector({
    apiKey: process.env.REVENUECAT_API_KEY ?? "",
    projectId: process.env.REVENUECAT_PROJECT_ID ?? "",
    webhookSecret: "",
  })
  let incomeByCurrency: Record<string, number> = { USD: 0 }
  try {
    const chart = await connector.fetchChart("revenue")
    const sum = chart.points
      .filter((p) => p.date.startsWith(month))
      .reduce((s, p) => s + p.value, 0)
    incomeByCurrency = { USD: Number(sum.toFixed(2)) }
  } catch {
    incomeByCurrency = { USD: 0 }
  }

  const service: any = req.scope.resolve(REVENUE_MODULE)
  const expenses = await service.listExpenses(tenantScopeFilter(req), {
    take: 1000,
  })

  // FX: ilgili her para birimi → raporlama birimi
  const currencies = new Set<string>([
    ...Object.keys(incomeByCurrency),
    ...expenses.map((e: any) => e.currency),
  ])
  const rateMap: Record<string, number> = {}
  for (const c of currencies) {
    rateMap[`${c}->${reportingCurrency}`] = await rateTo(c, reportingCurrency)
  }
  const rate = (from: string, to: string) => rateMap[`${from}->${to}`] ?? 1

  const report = computeMonthlyReport({
    month,
    reportingCurrency,
    incomeByCurrency,
    expenses,
    rate,
  })

  res.status(200).json({ report })
}
