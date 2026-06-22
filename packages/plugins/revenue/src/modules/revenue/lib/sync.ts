import { RevenueCatConnector } from "../connectors/revenuecat"
import { decryptSecret } from "./crypto"
import { REVENUE_MODULE } from "../types"

// RC "store" → bizim platform ekseni.
export const platformFromStore = (store: string): string => {
  const s = store.toLowerCase()
  if (s.includes("play") || s.includes("google") || s.includes("android")) {
    return "android"
  }
  if (s.includes("app store") || s.includes("ios") || s.includes("apple")) {
    return "ios"
  }
  if (s.includes("stripe") || s.includes("web")) {
    return "web"
  }
  return s
}

// Kayıtlı tüm RevenueCat kaynaklarını dolaşır → her app için (platform=all)
// toplam + (platform=ios/android) gelir snapshot'ları yazar. Secret .env'den
// (source.credentials_ref) okunur — DB'de değil.
export async function syncRevenuecatSources(
  container: any
): Promise<{ synced: number; skipped: number }> {
  const logger = container.resolve("logger")
  const service: any = container.resolve(REVENUE_MODULE)
  const sources = await service.listRevenueSources(
    { type: "revenuecat" },
    { take: 200 }
  )
  let synced = 0
  let skipped = 0

  for (const src of sources) {
    const apiKey =
      decryptSecret(src.secret_enc) ??
      (src.credentials_ref ? process.env[src.credentials_ref] : undefined)
    const projectId = src.external_id
    if (!apiKey || !projectId) {
      logger.warn(
        `[revenue] source ${src.id} (${src.name}) missing key/project; skip`
      )
      skipped++
      continue
    }
    try {
      const connector = new RevenueCatConnector({
        apiKey,
        projectId,
        webhookSecret: "",
      })
      const metrics = await connector.fetchMetrics()
      const today = new Date()

      // app toplamı
      await service.recordSnapshot({
        date: today,
        appId: src.app_id,
        platform: "all",
        sourceType: "revenuecat",
        fields: {
          mrr: metrics.mrr,
          active_subscriptions: metrics.activeSubscriptions,
          active_trials: metrics.activeTrials,
          new_customers: metrics.newCustomers,
          active_users: metrics.activeUsers,
          gross_revenue: metrics.revenue28d,
          currency: metrics.currency,
        },
      })

      // platform bazında gelir (segment=store)
      try {
        const chart = await connector.fetchChart("revenue", { segment: "store" })
        const byStore: Record<string, number> = {}
        for (const p of chart.points) {
          if (p.segment && p.segment !== "Total") {
            byStore[p.segment] = (byStore[p.segment] ?? 0) + p.value
          }
        }
        for (const [store, val] of Object.entries(byStore)) {
          await service.recordSnapshot({
            date: today,
            appId: src.app_id,
            platform: platformFromStore(store),
            sourceType: "revenuecat",
            fields: {
              gross_revenue: Number(val.toFixed(2)),
              currency: metrics.currency,
            },
          })
        }
      } catch (e: any) {
        logger.warn(`[revenue] ${src.name} store-chart failed: ${e?.message}`)
      }

      await service.updateRevenueSources({
        id: src.id,
        last_synced_at: today,
        last_error: null,
      })
      synced++
      logger.info(
        `[revenue] synced ${src.name}: MRR=${metrics.mrr} ${metrics.currency}`
      )
    } catch (e: any) {
      await service
        .updateRevenueSources({ id: src.id, last_error: String(e?.message ?? e) })
        .catch(() => {})
      logger.error(`[revenue] sync failed ${src.name}: ${e?.message ?? e}`)
      skipped++
    }
  }
  return { synced, skipped }
}
