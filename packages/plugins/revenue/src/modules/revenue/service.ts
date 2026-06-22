import { MedusaService } from "@medusajs/framework/utils"
import App from "./models/app"
import RevenueSource from "./models/revenue-source"
import RevenueEvent from "./models/revenue-event"
import Expense from "./models/expense"
import MetricSnapshot from "./models/metric-snapshot"
import { RevenueSourceType } from "./types"
import type { CanonicalEvent, ProviderMetrics } from "./connectors/types"

class RevenueModuleService extends MedusaService({
  App,
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

  // Per-(app, platform, source_type) snapshot upsert (app-merkezli sync).
  async recordSnapshot({
    date,
    appId,
    platform,
    sourceType,
    fields,
  }: {
    date: Date
    appId: string | null
    platform: string
    sourceType: string
    fields: Record<string, any>
  }): Promise<void> {
    const day = new Date(date.toISOString().slice(0, 10))
    const existing = await this.listMetricSnapshots(
      { date: day, app_id: appId, platform, source_type: sourceType },
      { take: 1 }
    )
    const data = {
      date: day,
      app_id: appId,
      platform,
      source_type: sourceType,
      currency: fields.currency ?? "USD",
      ...fields,
    }
    if (existing.length) {
      await this.updateMetricSnapshots({ id: existing[0].id, ...data })
    } else {
      await this.createMetricSnapshots(data)
    }
  }

  // Her app'in en güncel "platform=all" revenuecat snapshot'ı.
  private async latestPerApp(): Promise<any[]> {
    const snaps = await this.listMetricSnapshots(
      { platform: "all", source_type: "revenuecat" },
      { order: { date: "DESC" }, take: 2000 }
    )
    const byApp = new Map<string, any>()
    for (const s of snaps) {
      if (s.app_id && !byApp.has(s.app_id)) {
        byApp.set(s.app_id, s)
      }
    }
    return [...byApp.values()]
  }

  // Per-app kırılım (Apps listesi).
  async getAppsOverview() {
    const apps = await this.listApps({}, { order: { name: "ASC" }, take: 200 })
    const latest = await this.latestPerApp()
    const byId = new Map(latest.map((s) => [s.app_id, s]))
    return apps.map((a) => {
      const s = byId.get(a.id)
      return {
        id: a.id,
        name: a.name,
        mrr: s ? Number(s.mrr) : 0,
        revenue28d: s ? Number(s.gross_revenue) : 0,
        activeSubscriptions: s ? s.active_subscriptions : 0,
        newCustomers: s ? s.new_customers : 0,
        activeUsers: s ? s.active_users : 0,
        currency: s?.currency ?? "USD",
        lastSyncedDate: s ? s.date.toISOString().slice(0, 10) : null,
      }
    })
  }

  // Tek app detayı: toplam metrik + platform/kaynak kırılımı.
  async getAppDetail(appId: string) {
    const apps = await this.listApps({ id: appId }, { take: 1 })
    const app = apps[0]
    const snaps = await this.listMetricSnapshots(
      { app_id: appId },
      { order: { date: "DESC" }, take: 500 }
    )
    const latest = new Map<string, any>()
    for (const s of snaps) {
      const k = `${s.platform}|${s.source_type}`
      if (!latest.has(k)) {
        latest.set(k, s)
      }
    }
    const all = latest.get("all|revenuecat")
    const platforms = [...latest.values()]
      .filter((s) => s.platform !== "all")
      .map((s) => ({
        platform: s.platform,
        source_type: s.source_type,
        revenue: Number(s.gross_revenue),
        currency: s.currency,
      }))
      .sort((a, b) => b.revenue - a.revenue)
    return {
      id: appId,
      name: app?.name ?? appId,
      mrr: Number(all?.mrr ?? 0),
      revenue28d: Number(all?.gross_revenue ?? 0),
      activeSubscriptions: all?.active_subscriptions ?? 0,
      activeTrials: all?.active_trials ?? 0,
      newCustomers: all?.new_customers ?? 0,
      activeUsers: all?.active_users ?? 0,
      currency: all?.currency ?? "USD",
      lastSyncedDate: all ? all.date.toISOString().slice(0, 10) : null,
      platforms,
    }
  }

  // Genel toplam — tüm app'lerin son snapshot'ları toplanır.
  async getOverview() {
    const apps = await this.latestPerApp()
    const sumN = (f: string) =>
      Number(apps.reduce((a, s) => a + Number(s[f] ?? 0), 0).toFixed(2))
    const sumI = (f: string) => apps.reduce((a, s) => a + (s[f] ?? 0), 0)
    const revenue28d = sumN("gross_revenue")
    const expenses = await this.listExpenses({}, { take: 1000 })
    const expenseTotal = Number(
      expenses.reduce((a, e) => a + Number(e.amount), 0).toFixed(2)
    )
    const recentEvents = await this.listRevenueEvents(
      {},
      { order: { occurred_at: "DESC" }, take: 10 }
    )
    return {
      mrr: sumN("mrr"),
      activeSubscriptions: sumI("active_subscriptions"),
      activeTrials: sumI("active_trials"),
      newCustomers: sumI("new_customers"),
      activeUsers: sumI("active_users"),
      revenue28d,
      expenseTotal,
      net: Number((revenue28d - expenseTotal).toFixed(2)),
      currency: apps[0]?.currency ?? "USD",
      recentEvents,
      mrrTrend: [],
    }
  }
}

export default RevenueModuleService
