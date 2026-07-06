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
  private async listForTenant<T extends { id: string }>(
    listFn: (
      filter: Record<string, unknown>,
      config?: Record<string, unknown>
    ) => Promise<T[]>,
    tenantId?: string,
    base: Record<string, unknown> = {},
    config?: Record<string, unknown>
  ): Promise<T[]> {
    if (!tenantId) {
      return listFn(base, config)
    }
    const [scoped, legacy] = await Promise.all([
      listFn({ ...base, tenant_id: tenantId }, config),
      listFn({ ...base, tenant_id: null }, config),
    ])
    const byId = new Map<string, T>()
    for (const row of [...legacy, ...scoped]) {
      byId.set(row.id, row)
    }
    return Array.from(byId.values())
  }

  private tFilter(
    tenantId?: string,
    base: Record<string, unknown> = {}
  ): Record<string, unknown> {
    return tenantId ? { ...base, tenant_id: tenantId } : base
  }

  async recordEvents(
    sourceId: string,
    sourceType: RevenueSourceType,
    events: CanonicalEvent[],
    tenantId?: string
  ): Promise<number> {
    const [source] = await this.listRevenueSources({ id: sourceId }, { take: 1 })
    const rowTenantId =
      (source as { tenant_id?: string | null } | undefined)?.tenant_id ??
      tenantId ??
      null
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
        tenant_id: rowTenantId,
      })
      written++
    }
    return written
  }

  async upsertDailySnapshot({
    date,
    metrics,
    expenseTotal,
    tenantId,
  }: {
    date: Date
    metrics: ProviderMetrics
    expenseTotal: number
    tenantId?: string
  }): Promise<void> {
    const day = new Date(date.toISOString().slice(0, 10))
    const existing = await this.listMetricSnapshots(
      this.tFilter(tenantId, { date: day, app_id: null, source_type: null }),
      { take: 1 }
    )
    const data = {
      date: day,
      app_id: null,
      source_type: null,
      tenant_id: tenantId ?? null,
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
    tenantId,
  }: {
    date: Date
    appId: string | null
    platform: string
    sourceType: string
    fields: Record<string, any>
    tenantId?: string | null
  }): Promise<void> {
    const day = new Date(date.toISOString().slice(0, 10))
    const existing = await this.listMetricSnapshots(
      this.tFilter(tenantId ?? undefined, {
        date: day,
        app_id: appId,
        platform,
        source_type: sourceType,
      }),
      { take: 1 }
    )
    const data = {
      date: day,
      app_id: appId,
      platform,
      source_type: sourceType,
      tenant_id: tenantId ?? null,
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
  private async latestPerApp(tenantId?: string): Promise<any[]> {
    const snaps = await this.listForTenant(
      (filter, config) => this.listMetricSnapshots(filter, config),
      tenantId,
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

  // Tüm AdMob günlük snapshot'ları (gün gün saklanır).
  private async admobSnaps(tenantId?: string): Promise<any[]> {
    return this.listForTenant(
      (filter, config) => this.listMetricSnapshots(filter, config),
      tenantId,
      { source_type: "admob" },
      { order: { date: "DESC" }, take: 5000 }
    )
  }

  // Takvim-ayı sınırları (UTC): bu ayın 1'i ve geçen ayın 1'i.
  private monthBounds(): { thisStart: Date; lastStart: Date } {
    const now = new Date()
    return {
      thisStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      lastStart: new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
      ),
    }
  }

  // Reklam geliri (app başına) — [start, end) takvim aralığında, kendi birimiyle.
  private async adRevenueByApp(
    start: Date,
    end?: Date,
    tenantId?: string
  ): Promise<Map<string, { amount: number; currency: string }>> {
    const byApp = new Map<string, { amount: number; currency: string }>()
    for (const s of await this.admobSnaps(tenantId)) {
      if (!s.app_id) {
        continue
      }
      const d = new Date(s.date)
      if (d < start || (end && d >= end)) {
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

  // Tüm abonelik (revenuecat, platform=all) günlük snapshot'ları.
  private async subsSnaps(tenantId?: string): Promise<any[]> {
    return this.listMetricSnapshots(
      this.tFilter(tenantId, { platform: "all", source_type: "revenuecat" }),
      { order: { date: "DESC" }, take: 5000 }
    )
  }

  // Abonelik geliri (app başına) — [start, end) takvim aralığında, kendi birimiyle.
  private async subsRevenueByApp(
    start: Date,
    end?: Date,
    tenantId?: string
  ): Promise<Map<string, { amount: number; currency: string }>> {
    const byApp = new Map<string, { amount: number; currency: string }>()
    for (const s of await this.subsSnaps(tenantId)) {
      if (!s.app_id) {
        continue
      }
      const d = new Date(s.date)
      if (d < start || (end && d >= end)) {
        continue
      }
      const cur = byApp.get(s.app_id) ?? {
        amount: 0,
        currency: s.currency ?? "USD",
      }
      cur.amount += Number(s.gross_revenue ?? 0)
      byApp.set(s.app_id, cur)
    }
    return byApp
  }

  // Abonelik geliri PLATFORM bazında (komisyon için) — [start, end) aralığında.
  private async subsRevenueByPlatform(
    start: Date,
    end?: Date,
    tenantId?: string
  ): Promise<Map<string, { amount: number; currency: string }>> {
    const snaps = await this.listMetricSnapshots(
      this.tFilter(tenantId, { source_type: "revenuecat" }),
      { order: { date: "DESC" }, take: 5000 }
    )
    const byPlat = new Map<string, { amount: number; currency: string }>()
    for (const s of snaps) {
      if (s.platform === "all") {
        continue
      }
      const d = new Date(s.date)
      if (d < start || (end && d >= end)) {
        continue
      }
      const cur = byPlat.get(s.platform) ?? {
        amount: 0,
        currency: s.currency ?? "USD",
      }
      cur.amount += Number(s.gross_revenue ?? 0)
      byPlat.set(s.platform, cur)
    }
    return byPlat
  }

  // Finans ayarları (komisyon yüzdeleri + vergi oranı). Yoksa 0.
  async getSettings(tenantId?: string) {
    const s = (
      await this.listRevenueSources(this.tFilter(tenantId), { take: 500 })
    ).find((x: any) => x.provider === "settings")
    const c = s?.config ?? {}
    return {
      appleCommission: Number(c.apple_commission ?? 0),
      googleCommission: Number(c.google_commission ?? 0),
      otherCommission: Number(c.other_commission ?? 0),
      taxRate: Number(c.tax_rate ?? 0),
    }
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
  async getAppsOverview(display = "USD", tenantId?: string) {
    display = (display || "USD").toUpperCase()
    const apps = await this.listApps(this.tFilter(tenantId), {
      order: { name: "ASC" },
      take: 200,
    })
    const latest = await this.latestPerApp(tenantId)
    const { thisStart } = this.monthBounds()
    const adByApp = await this.adRevenueByApp(thisStart, undefined, tenantId)
    const subsByApp = await this.subsRevenueByApp(thisStart, undefined, tenantId)
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
      const sub = subsByApp.get(a.id)
      const revenue28d = sub?.amount ?? 0 // artık bu ay (takvim)
      const adRevenue = ad?.amount ?? 0
      const adCurrency = ad?.currency ?? display
      const subCurrency = sub?.currency ?? s?.currency ?? "USD"
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
  async getAppDetail(appId: string, tenantId?: string) {
    const apps = await this.listApps(this.tFilter(tenantId, { id: appId }), {
      take: 1,
    })
    const app = apps[0]
    const snaps = await this.listMetricSnapshots(
      this.tFilter(tenantId, { app_id: appId }),
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
    const { thisStart } = this.monthBounds()
    const ad = (await this.adRevenueByApp(thisStart, undefined, tenantId)).get(
      appId
    )
    const sub = (await this.subsRevenueByApp(thisStart, undefined, tenantId)).get(
      appId
    )
    return {
      id: appId,
      name: app?.name ?? appId,
      mrr: Number(all?.mrr ?? 0),
      revenue28d: sub?.amount ?? 0, // bu ay (takvim)
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

  // Reklam detayı: günlük seri (platform kırılımlı) + ürün×platform satırları (bu ay).
  async getAdBreakdown(display = "USD", tenantId?: string) {
    display = (display || "USD").toUpperCase()
    const snaps = await this.admobSnaps(tenantId)
    const apps = await this.listApps(this.tFilter(tenantId), { take: 200 })
    const nameById = new Map(apps.map((a) => [a.id, a.name]))
    const rates = await this.fxMap(
      snaps.map((s) => s.currency ?? display),
      display
    )
    const conv = (amt: any, cur?: string) =>
      Number(amt ?? 0) * (rates.get((cur || display).toUpperCase()) ?? 1)
    const r2 = (n: number) => Number(n.toFixed(2))
    const { thisStart } = this.monthBounds()

    const dayMap = new Map<
      string,
      { ios: number; android: number; total: number }
    >()
    const rowMap = new Map<
      string,
      {
        appId: string
        appName: string
        platform: string
        amount: number
        impressions: number
      }
    >()
    for (const s of snaps) {
      const d = new Date(s.date)
      const dateStr = d.toISOString().slice(0, 10)
      const v = conv(s.ad_revenue, s.currency)
      const day = dayMap.get(dateStr) ?? { ios: 0, android: 0, total: 0 }
      if (s.platform === "ios") {
        day.ios += v
      } else if (s.platform === "android") {
        day.android += v
      }
      day.total += v
      dayMap.set(dateStr, day)

      if (d >= thisStart && s.app_id) {
        const key = `${s.app_id}|${s.platform}`
        const row = rowMap.get(key) ?? {
          appId: s.app_id,
          appName: nameById.get(s.app_id) ?? s.app_id,
          platform: s.platform,
          amount: 0,
          impressions: 0,
        }
        row.amount += v
        row.impressions += Number(s.ad_impressions ?? 0)
        rowMap.set(key, row)
      }
    }

    const daily = [...dayMap.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, d]) => ({
        date,
        ios: r2(d.ios),
        android: r2(d.android),
        total: r2(d.total),
      }))
    const rows = [...rowMap.values()]
      .map((r) => ({
        appId: r.appId,
        appName: r.appName,
        platform: r.platform,
        amount: r2(r.amount),
        impressions: r.impressions,
        ecpm: r.impressions > 0 ? r2((r.amount / r.impressions) * 1000) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    return { currency: display, daily, rows }
  }

  // Genel P&L — abonelik + reklam + gider, hepsi display birimine FX-normalize.
  async getOverview(display = "USD", tenantId?: string) {
    display = (display || "USD").toUpperCase()
    const subs = await this.latestPerApp(tenantId)
    const adSnaps = await this.admobSnaps(tenantId)
    const { thisStart, lastStart } = this.monthBounds()
    const expenses = await this.listForTenant(
      (filter, config) => this.listExpenses(filter, config),
      tenantId,
      {},
      { take: 1000 }
    )

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

    // Abonelik: bu ay / geçen ay (takvim) — reklamla aynı pencere.
    const subsThis = await this.subsRevenueByApp(thisStart, undefined, tenantId)
    const subsLast = await this.subsRevenueByApp(lastStart, thisStart, tenantId)
    let mrr = 0
    for (const s of subs) {
      mrr += conv(s.mrr, s.currency)
    }
    let subscriptionRevenue = 0
    for (const a of subsThis.values()) {
      subscriptionRevenue += conv(a.amount, a.currency)
    }
    let subscriptionRevenueLastMonth = 0
    for (const a of subsLast.values()) {
      subscriptionRevenueLastMonth += conv(a.amount, a.currency)
    }
    // Reklam: bu ay (takvim 1→bugün) ana sayı; geçen ay karşılaştırma için.
    // adRevenueNow = bugünkü (takvim günü) reklam geliri.
    let adRevenue = 0
    let adImpressions = 0
    let adRevenueLastMonth = 0
    let adRevenueNow = 0
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const platAgg = new Map<string, { amount: number; impressions: number }>()
    for (const s of adSnaps) {
      const d = new Date(s.date)
      const v = conv(s.ad_revenue, s.currency)
      if (d >= thisStart) {
        adRevenue += v
        if (d >= todayStart) {
          adRevenueNow += v
        }
        const imp = Number(s.ad_impressions ?? 0)
        adImpressions += imp
        const p = platAgg.get(s.platform) ?? { amount: 0, impressions: 0 }
        p.amount += v
        p.impressions += imp
        platAgg.set(s.platform, p)
      } else if (d >= lastStart) {
        adRevenueLastMonth += v
      }
    }
    const ecpm = (amount: number, imp: number) =>
      imp > 0 ? Number(((amount / imp) * 1000).toFixed(2)) : 0

    const expensesInMonth = expenses.filter((e) => {
      const d = new Date(e.occurred_at)
      return d >= thisStart
    })
    const expenseTotal = expensesInMonth.reduce(
      (a, e) => a + conv(e.amount, e.currency),
      0
    )

    // Komisyon: abonelik geliri platform bazında (Apple/Google/diğer %).
    const settings = await this.getSettings(tenantId)
    const subsByPlat = await this.subsRevenueByPlatform(thisStart, undefined, tenantId)
    let commission = 0
    for (const [plat, a] of subsByPlat) {
      const rate =
        plat === "ios"
          ? settings.appleCommission
          : plat === "android"
            ? settings.googleCommission
            : settings.otherCommission
      commission += conv(a.amount, a.currency) * (rate / 100)
    }
    // Vergi: komisyon + gider sonrası kâr üzerinden.
    const totalRevenue = subscriptionRevenue - commission + adRevenue
    const profitBeforeTax = totalRevenue - expenseTotal
    const taxTotal =
      profitBeforeTax > 0 ? profitBeforeTax * (settings.taxRate / 100) : 0

    const recentEvents = await this.listRevenueEvents(this.tFilter(tenantId), {
      order: { occurred_at: "DESC" },
      take: 10,
    })
    const sync = await this.buildSyncMeta(tenantId, subs, adSnaps)
    return {
      currency: display,
      mrr: r2(mrr),
      subscriptionRevenue: r2(subscriptionRevenue),
      subscriptionRevenueLastMonth: r2(subscriptionRevenueLastMonth),
      adRevenue: r2(adRevenue),
      adRevenueNow: r2(adRevenueNow),
      adRevenueLastMonth: r2(adRevenueLastMonth),
      adImpressions,
      adEcpm: ecpm(adRevenue, adImpressions),
      commission: r2(commission),
      taxTotal: r2(taxTotal),
      totalRevenue: r2(totalRevenue),
      revenue28d: r2(subscriptionRevenue), // geri uyumluluk (abonelik)
      expenseTotal: r2(expenseTotal),
      expensesThisMonth: expensesInMonth.map((e) => ({
        id: e.id,
        description: e.description,
        category: e.category,
        amount: r2(conv(e.amount, e.currency)),
        currency: display,
        occurred_at: e.occurred_at,
        vendor: e.vendor ?? null,
        invoice_number: e.invoice_number ?? null,
        invoice_url: e.invoice_url ?? null,
      })),
      net: r2(profitBeforeTax - taxTotal),
      activeSubscriptions: sumI("active_subscriptions"),
      activeTrials: sumI("active_trials"),
      newCustomers: sumI("new_customers"),
      activeUsers: sumI("active_users"),
      adByPlatform: [...platAgg.entries()]
        .map(([platform, d]) => ({
          platform,
          amount: r2(d.amount),
          impressions: d.impressions,
          ecpm: ecpm(d.amount, d.impressions),
        }))
        .sort((a, b) => b.amount - a.amount),
      recentEvents,
      mrrTrend: [],
      sync,
    }
  }

  /** Last provider sync + latest snapshot dates for the dashboard meta bar. */
  private async buildSyncMeta(
    tenantId: string | undefined,
    subs: { date: Date | string }[],
    adSnaps: { date: Date | string }[]
  ) {
    const sources = await this.listRevenueSources(this.tFilter(tenantId), {
      take: 500,
    })
    const latestSync = (pred: (s: { type?: string; provider?: string | null; last_synced_at?: Date | string | null }) => boolean) => {
      let max: Date | null = null
      for (const s of sources) {
        if (!pred(s) || !s.last_synced_at) {
          continue
        }
        const d = new Date(s.last_synced_at)
        if (!max || d > max) {
          max = d
        }
      }
      return max?.toISOString() ?? null
    }
    const maxSnapshotDay = (snaps: { date: Date | string }[]) => {
      let max: Date | null = null
      for (const s of snaps) {
        const d = new Date(s.date)
        if (!max || d > max) {
          max = d
        }
      }
      return max ? max.toISOString().slice(0, 10) : null
    }
    return {
      revenuecatLastSyncedAt: latestSync((s) => s.type === "revenuecat"),
      admobLastSyncedAt: latestSync((s) => s.provider === "admob"),
      subscriptionDataThrough: maxSnapshotDay(subs),
      adDataThrough: maxSnapshotDay(adSnaps),
    }
  }
}

export default RevenueModuleService
