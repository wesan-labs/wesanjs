import { RevenueEventKind, RevenueSourceType } from "../types"
import { CanonicalEvent, ProviderMetrics, RevenueConnector } from "./types"

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
    const body = (await res.json()) as { metrics?: Array<{ id: string; value: number; unit?: string }> }
    const byId = new Map((body.metrics ?? []).map((m) => [m.id, m]))
    const num = (id: string) => Number(byId.get(id)?.value ?? 0)
    // ⚠️ Confirm these metric ids against the first live response; adjust if cased differently.
    return {
      mrr: num("mrr"),
      activeSubscriptions: num("active_subscriptions"),
      activeTrials: num("active_trials"),
      revenue28d: num("revenue") || num("revenue_last_28_days"),
      currency: byId.get("mrr")?.unit ?? "USD",
    }
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
