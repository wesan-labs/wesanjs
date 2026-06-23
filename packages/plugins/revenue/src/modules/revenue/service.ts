import { MedusaService } from "@medusajs/framework/utils"
import App from "./models/app"
import RevenueSource from "./models/revenue-source"
import RevenueEvent from "./models/revenue-event"
import Expense from "./models/expense"
import MetricSnapshot from "./models/metric-snapshot"
import { RevenueSourceType } from "./types"
import type { CanonicalEvent, ProviderMetrics } from "./connectors/types"
import { rateTo } from "./lib/fx"

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

  // AdMob snapshot'larının (app|platform) en güncel hali.
  private async latestAdmobSnaps(): Promise<any[]> {
    const snaps = await this.listMetricSnapshots(
      { source_type: "admob" },
      { order: { date: "DESC" }, take: 5000 }
    )
    const latest = new Map<string, any>()
    for (const s of snaps) {
      const k = `${s.app_id}|${s.platform}`
      if (!latest.has(k)) {
        latest.set(k, s)
      }
    }
    return [...latest.values()]
  }

  // Reklam geliri (app başına son hali) — kendi para birimiyle.
  private async adRevenueByApp(): Promise<
    Map<string, { amount: number; currency: string }>
  > {
    const byApp = new Map<string, { amount: number; currency: string }>()
    for (const s of await this.latestAdmobSnaps()) {
      if (!s.app_id) {
        continue
      }
      const cur = byApp.get(s.app_id) ?? {
        amount: 0,
        currency: s.currency ?? "USD",
      }
      cur.amount += Number(s.ad_revenue ?? 0)
      byApp.set(s.app_id, cur)
    }
    return byApp
  }

  // Verilen para birimleri için display'e kur tablosu (distinct → tek FX çağrısı).
  private async fxMap(
    currencies: Iterable<string>,
    display: string
  ): Promise<Map<string, number>> {
    const m = new Map<string, number>()
    for (const raw of new Set(currencies)) {
      const cur = (raw || display).toUpperCase()
      if (!m.has(cur)) {
        m.set(cur, await rateTo(cur, display))
      }
    }
    return m
  }

  // Per-app kırılım (Apps listesi) — display birimine normalize toplam.
  async getAppsOverview(display = "USD") {
    display = (display || "USD").toUpperCase()
    const apps = await this.listApps({}, { order: { name: "ASC" }, take: 200 })
    const latest = await this.latestPerApp()
    const adByApp = await this.adRevenueByApp()
    const byId = new Map(latest.map((s) => [s.app_id, s]))
    const rates = await this.fxMap(
      [
        ...latest.map((s) => s.currency ?? display),
        ...[...adByApp.values()].map((a) => a.currency),
      ],
      display
    )
    const conv = (amt: any, cur?: string) =>
      Number(amt ?? 0) * (rates.get((cur || display).toUpperCase()) ?? 1)

    return apps.map((a) => {
      const s = byId.get(a.id)
      const ad = adByApp.get(a.id)
      const revenue28d = s ? Number(s.gross_revenue) : 0
      const adRevenue = ad?.amount ?? 0
      const adCurrency = ad?.currency ?? display
      const subCurrency = s?.currency ?? "USD"
      return {
        id: a.id,
        name: a.name,
        mrr: s ? Number(s.mrr) : 0,
        revenue28d,
        adRevenue,
        adCurrency,
        totalDisplay: Number(
          (conv(revenue28d, subCurrency) + conv(adRevenue, adCurrency)).toFixed(2)
        ),
        displayCurrency: display,
        activeSubscriptions: s ? s.active_subscriptions : 0,
        newCustomers: s ? s.new_customers : 0,
        activeUsers: s ? s.active_users : 0,
        currency: subCurrency,
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
    const ad = (await this.adRevenueByApp()).get(appId)
    return {
      id: appId,
      name: app?.name ?? appId,
      mrr: Number(all?.mrr ?? 0),
      revenue28d: Number(all?.gross_revenue ?? 0),
      adRevenue: ad?.amount ?? 0,
      adCurrency: ad?.currency ?? (all?.currency ?? "USD"),
      activeSubscriptions: all?.active_subscriptions ?? 0,
      activeTrials: all?.active_trials ?? 0,
      newCustomers: all?.new_customers ?? 0,
      activeUsers: all?.active_users ?? 0,
      currency: all?.currency ?? "USD",
      lastSyncedDate: all ? all.date.toISOString().slice(0, 10) : null,
      platforms,
    }
  }

  // Genel P&L — abonelik + reklam + gider, hepsi display birimine FX-normalize.
  async getOverview(display = "USD") {
    display = (display || "USD").toUpperCase()
    const subs = await this.latestPerApp()
    const adSnaps = await this.latestAdmobSnaps()
    const expenses = await this.listExpenses({}, { take: 1000 })

    const rates = await this.fxMap(
      [
        ...subs.map((s) => s.currency ?? display),
        ...adSnaps.map((s) => s.currency ?? display),
        ...expenses.map((e) => e.currency ?? display),
      ],
      display
    )
    const conv = (amt: any, cur?: string) =>
      Number(amt ?? 0) * (rates.get((cur || display).toUpperCase()) ?? 1)
    const r2 = (n: number) => Number(n.toFixed(2))
    const sumI = (f: string) => subs.reduce((a, s) => a + (s[f] ?? 0), 0)

    let subscriptionRevenue = 0
    let mrr = 0
    for (const s of subs) {
      subscriptionRevenue += conv(s.gross_revenue, s.currency)
      mrr += conv(s.mrr, s.currency)
    }
    let adRevenue = 0
    const platAgg = new Map<string, number>()
    for (const s of adSnaps) {
      const v = conv(s.ad_revenue, s.currency)
      adRevenue += v
      platAgg.set(s.platform, (platAgg.get(s.platform) ?? 0) + v)
    }
    const expenseTotal = expenses.reduce(
      (a, e) => a + conv(e.amount, e.currency),
      0
    )
    const totalRevenue = subscriptionRevenue + adRevenue

    const recentEvents = await this.listRevenueEvents(
      {},
      { order: { occurred_at: "DESC" }, take: 10 }
    )
    return {
      currency: display,
      mrr: r2(mrr),
      subscriptionRevenue: r2(subscriptionRevenue),
      adRevenue: r2(adRevenue),
      totalRevenue: r2(totalRevenue),
      revenue28d: r2(subscriptionRevenue), // geri uyumluluk (abonelik)
      expenseTotal: r2(expenseTotal),
      net: r2(totalRevenue - expenseTotal),
      activeSubscriptions: sumI("active_subscriptions"),
      activeTrials: sumI("active_trials"),
      newCustomers: sumI("new_customers"),
      activeUsers: sumI("active_users"),
      adByPlatform: [...platAgg.entries()]
        .map(([platform, amount]) => ({ platform, amount: r2(amount) }))
        .sort((a, b) => b.amount - a.amount),
      recentEvents,
      mrrTrend: [],
    }
  }
}

export default RevenueModuleService
