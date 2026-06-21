import { MedusaService } from "@medusajs/framework/utils"
import RevenueSource from "./models/revenue-source"
import RevenueEvent from "./models/revenue-event"
import Expense from "./models/expense"
import MetricSnapshot from "./models/metric-snapshot"
import { RevenueSourceType } from "./types"
import type { CanonicalEvent, ProviderMetrics } from "./connectors/types"

class RevenueModuleService extends MedusaService({
  RevenueSource,
  RevenueEvent,
  Expense,
  MetricSnapshot,
}) {
  async recordEvents(
    sourceId: string,
    sourceType: RevenueSourceType,
    events: CanonicalEvent[]
  ): Promise<number> {
    let written = 0
    for (const e of events) {
      const existing = await this.listRevenueEvents(
        { source_id: sourceId, external_id: e.externalId },
        { take: 1 }
      )
      if (existing.length) continue
      await this.createRevenueEvents({
        source_id: sourceId,
        source_type: sourceType,
        external_id: e.externalId,
        kind: e.kind,
        gross_amount: e.grossAmount,
        currency: e.currency,
        occurred_at: e.occurredAt,
        raw_payload: e.raw as Record<string, unknown>,
      })
      written++
    }
    return written
  }

  async upsertDailySnapshot({
    date,
    metrics,
    expenseTotal,
  }: {
    date: Date
    metrics: ProviderMetrics
    expenseTotal: number
  }): Promise<void> {
    const day = new Date(date.toISOString().slice(0, 10))
    const existing = await this.listMetricSnapshots(
      { date: day, app_id: null, source_type: null },
      { take: 1 }
    )
    const data = {
      date: day,
      app_id: null,
      source_type: null,
      mrr: metrics.mrr,
      active_subscriptions: metrics.activeSubscriptions,
      active_trials: metrics.activeTrials,
      new_customers: metrics.newCustomers,
      active_users: metrics.activeUsers,
      gross_revenue: metrics.revenue28d,
      net_revenue: metrics.revenue28d - expenseTotal,
      expense_total: expenseTotal,
      net_profit: metrics.revenue28d - expenseTotal,
      currency: metrics.currency,
    }
    if (existing.length) {
      await this.updateMetricSnapshots({ id: existing[0].id, ...data })
    } else {
      await this.createMetricSnapshots(data)
    }
  }

  async getOverview() {
    const snaps = await this.listMetricSnapshots(
      {},
      { order: { date: "DESC" }, take: 30 }
    )
    const latest = snaps[0]
    const expenses = await this.listExpenses({}, { take: 1000 })
    const expenseTotal = Number(
      expenses.reduce((a, e) => a + Number(e.amount), 0).toFixed(2)
    )
    const recentEvents = await this.listRevenueEvents(
      {},
      { order: { occurred_at: "DESC" }, take: 10 }
    )
    const revenue28d = latest ? Number(latest.gross_revenue) : 0
    return {
      mrr: latest ? Number(latest.mrr) : 0,
      activeSubscriptions: latest ? latest.active_subscriptions : 0,
      activeTrials: latest?.active_trials ?? 0,
      newCustomers: latest?.new_customers ?? 0,
      activeUsers: latest?.active_users ?? 0,
      revenue28d,
      expenseTotal,
      net: Number((revenue28d - expenseTotal).toFixed(2)),
      currency: latest?.currency ?? "USD",
      recentEvents,
      mrrTrend: snaps
        .slice()
        .reverse()
        .map((s) => ({ date: s.date.toISOString().slice(0, 10), mrr: Number(s.mrr) })),
    }
  }
}

export default RevenueModuleService
