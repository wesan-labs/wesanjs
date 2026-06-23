import { RevenueEventKind, RevenueSourceType } from "../types"
import { CanonicalEvent, ChartPoint, ProviderMetrics, RevenueConnector } from "./types"

const RC_BASE = "https://api.revenuecat.com/v2"

// RevenueCat webhook event.type → our canonical kind
const KIND_MAP: Record<string, RevenueEventKind> = {
  INITIAL_PURCHASE: RevenueEventKind.SUBSCRIPTION_INITIAL,
  RENEWAL: RevenueEventKind.SUBSCRIPTION_RENEWAL,
  NON_RENEWING_PURCHASE: RevenueEventKind.ONE_TIME,
  CANCELLATION: RevenueEventKind.REFUND,
  REFUND: RevenueEventKind.REFUND,
}

export class RevenueCatConnector implements RevenueConnector {
  type = RevenueSourceType.REVENUECAT
  constructor(
    private opts: { apiKey: string; projectId: string; webhookSecret: string }
  ) {}

  async fetchMetrics(): Promise<ProviderMetrics> {
    const res = await fetch(
      `${RC_BASE}/projects/${this.opts.projectId}/metrics/overview`,
      { headers: { Authorization: `Bearer ${this.opts.apiKey}` } }
    )
    if (!res.ok) {
      throw new Error(`RevenueCat overview failed: ${res.status} ${await res.text()}`)
    }
    const body = (await res.json()) as {
      currency?: string
      metrics?: Array<{ id: string; value: number; unit?: string }>
    }
    const byId = new Map((body.metrics ?? []).map((m) => [m.id, m]))
    const num = (id: string) => Number(byId.get(id)?.value ?? 0)
    // Metric ids confirmed against live RC v2 response: mrr, active_subscriptions,
    // active_trials, revenue. Currency is the TOP-LEVEL field (metric.unit is "$", not ISO).
    return {
      mrr: num("mrr"),
      activeSubscriptions: num("active_subscriptions"),
      activeTrials: num("active_trials"),
      revenue28d: num("revenue") || num("revenue_last_28_days"),
      currency: body.currency ?? "USD",
      newCustomers: num("new_customers"),
      activeUsers: num("active_users"),
    }
  }

  async fetchChart(
    metric: string,
    opts?: { segment?: string }
  ): Promise<{ points: ChartPoint[]; segments: string[] }> {
    // Time: O(n) where n = chart data points
    // Space: O(n)
    const base = `${RC_BASE}/projects/${this.opts.projectId}/charts/${metric}`
    const url = opts?.segment ? `${base}?segment=${opts.segment}` : base
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.opts.apiKey}` },
    })
    if (!res.ok) {
      throw new Error(`RevenueCat chart failed: ${res.status} ${await res.text()}`)
    }
    const body = (await res.json()) as {
      values?: Array<{
        cohort: number
        value: number
        segment?: number
        measure?: number
      }>
      segments?: Array<{ display_name: string }>
    }
    const segmentNames = (body.segments ?? []).map((s) => s.display_name)
    // measure 0 = "Revenue"; measure 1 = "Transactions" (adet) — geliri kirletmesin.
    const points: ChartPoint[] = (body.values ?? [])
      .filter((v) => (v.measure ?? 0) === 0)
      .map((v) => {
        const point: ChartPoint = {
          date: new Date(v.cohort * 1000).toISOString().slice(0, 10),
          value: v.value,
        }
        if (v.segment !== undefined && segmentNames[v.segment] !== undefined) {
          point.segment = segmentNames[v.segment]
        }
        return point
      })
    return { points, segments: segmentNames }
  }

  // Günlük abonelik geliri (measure 0) — [start, end] takvim aralığında.
  async fetchRevenueDaily(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; value: number }>> {
    const ymd = (d: Date) => d.toISOString().slice(0, 10)
    const url =
      `${RC_BASE}/projects/${this.opts.projectId}/charts/revenue` +
      `?start_date=${ymd(startDate)}&end_date=${ymd(endDate)}&resolution=day`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.opts.apiKey}` },
    })
    if (!res.ok) {
      throw new Error(
        `RevenueCat revenue-daily failed: ${res.status} ${await res.text()}`
      )
    }
    const body = (await res.json()) as {
      values?: Array<{ cohort: number; value: number; measure?: number }>
    }
    return (body.values ?? [])
      .filter((v) => (v.measure ?? 0) === 0)
      .map((v) => ({
        date: new Date(v.cohort * 1000).toISOString().slice(0, 10),
        value: Number(v.value) || 0,
      }))
  }

  // Günlük abonelik geliri MAĞAZA bazında (measure 0) — komisyon hesabı için.
  async fetchRevenueDailyByStore(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; store: string; value: number }>> {
    const ymd = (d: Date) => d.toISOString().slice(0, 10)
    const url =
      `${RC_BASE}/projects/${this.opts.projectId}/charts/revenue` +
      `?segment=store&start_date=${ymd(startDate)}&end_date=${ymd(endDate)}&resolution=day`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.opts.apiKey}` },
    })
    if (!res.ok) {
      throw new Error(
        `RevenueCat revenue-by-store failed: ${res.status} ${await res.text()}`
      )
    }
    const body = (await res.json()) as {
      values?: Array<{
        cohort: number
        value: number
        segment?: number
        measure?: number
      }>
      segments?: Array<{ display_name: string }>
    }
    const names = (body.segments ?? []).map((s) => s.display_name)
    return (body.values ?? [])
      .filter(
        (v) =>
          (v.measure ?? 0) === 0 &&
          v.segment !== undefined &&
          names[v.segment] !== undefined &&
          names[v.segment] !== "Total"
      )
      .map((v) => ({
        date: new Date(v.cohort * 1000).toISOString().slice(0, 10),
        store: names[v.segment as number],
        value: Number(v.value) || 0,
      }))
  }

  parseWebhook(body: unknown): CanonicalEvent[] {
    const e = (body as { event?: Record<string, any> })?.event
    if (!e || !e.id || !e.type) return []
    const kind = KIND_MAP[e.type]
    if (!kind) return []
    const isRefund = kind === RevenueEventKind.REFUND
    const price = Number(e.price ?? e.price_in_purchased_currency ?? 0)
    return [
      {
        externalId: String(e.id),
        kind,
        grossAmount: isRefund ? -Math.abs(price) : price,
        currency: String(e.currency ?? "USD"),
        occurredAt: new Date(Number(e.event_timestamp_ms ?? Date.now())),
        raw: body,
      },
    ]
  }

  verifyWebhook(headers: Record<string, string | undefined>): boolean {
    const auth = headers["authorization"] ?? headers["Authorization"]
    return !!this.opts.webhookSecret && auth === this.opts.webhookSecret
  }
}
