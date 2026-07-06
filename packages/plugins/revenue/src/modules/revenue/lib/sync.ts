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
  container: any,
  tenantId?: string
): Promise<{ synced: number; skipped: number }> {
  const logger = container.resolve("logger")
  const service: any = container.resolve(REVENUE_MODULE)
  const sourceFilter: Record<string, unknown> = { type: "revenuecat" }
  if (tenantId) {
    sourceFilter.tenant_id = tenantId
  }
  const sources = await service.listRevenueSources(sourceFilter, { take: 200 })
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
      const rowTenantId = src.tenant_id ?? tenantId ?? null
      const monthStart = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)
      )

      // GÜN GÜN abonelik geliri (measure 0) — geçen ay başından bugüne.
      // Reklamla aynı desen: takvim-ayına toplanabilsin.
      try {
        const daily = await connector.fetchRevenueDaily(monthStart, today)
        for (const d of daily) {
          await service.recordSnapshot({
            date: new Date(d.date),
            appId: src.app_id,
            platform: "all",
            sourceType: "revenuecat",
            tenantId: rowTenantId,
            fields: {
              gross_revenue: Number(d.value.toFixed(2)),
              currency: metrics.currency,
            },
          })
        }
      } catch (e: any) {
        logger.warn(
          `[revenue] ${src.name} revenue-daily failed: ${e?.message ?? e}`
        )
      }

      // Güncel durum (MRR/abone) bugünün satırına — gross_revenue'ye DOKUNMA.
      await service.recordSnapshot({
        date: today,
        appId: src.app_id,
        platform: "all",
        sourceType: "revenuecat",
        tenantId: rowTenantId,
        fields: {
          mrr: metrics.mrr,
          active_subscriptions: metrics.activeSubscriptions,
          active_trials: metrics.activeTrials,
          new_customers: metrics.newCustomers,
          active_users: metrics.activeUsers,
          currency: metrics.currency,
        },
      })

      // GÜN GÜN platform bazında gelir (segment=store) — komisyon hesabı için.
      try {
        const byStore = await connector.fetchRevenueDailyByStore(
          monthStart,
          today
        )
        // (platform, gün) bazında topla
        const agg = new Map<string, { platform: string; day: string; value: number }>()
        for (const r of byStore) {
          const platform = platformFromStore(r.store)
          const key = `${platform}|${r.date}`
          const cur = agg.get(key) ?? { platform, day: r.date, value: 0 }
          cur.value += r.value
          agg.set(key, cur)
        }
        for (const v of agg.values()) {
          await service.recordSnapshot({
            date: new Date(v.day),
            appId: src.app_id,
            platform: v.platform,
            sourceType: "revenuecat",
            tenantId: rowTenantId,
            fields: {
              gross_revenue: Number(v.value.toFixed(2)),
              currency: metrics.currency,
            },
          })
        }
      } catch (e: any) {
        logger.warn(`[revenue] ${src.name} store-daily failed: ${e?.message}`)
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
