import { AdMobConnector } from "../connectors/admob"
import { decryptSecret } from "./crypto"
import { REVENUE_MODULE } from "../types"

// Tek AdMob hesabı → per-app/platform reklam geliri. Creds .env'de:
// ADMOB_CLIENT_ID, ADMOB_CLIENT_SECRET, ADMOB_REFRESH_TOKEN, ADMOB_PUBLISHER_ID.
// Rapor satırları app'e isim ya da external_ids.admob ile eşlenir.
export async function syncAdmob(
  container: any
): Promise<{ synced: number; skipped: number }> {
  const logger = container.resolve("logger")
  const service: any = container.resolve(REVENUE_MODULE)

  // Creds: önce UI'dan kaydedilen (şifreli) AdMob entegrasyonu, yoksa .env.
  const integ = (await service.listRevenueSources({}, { take: 500 })).find(
    (s: any) => s.provider === "admob" && s.secret_enc
  )
  let clientId: string | undefined
  let clientSecret: string | undefined
  let refreshToken: string | undefined
  let publisherId: string | undefined
  if (integ) {
    try {
      const p = JSON.parse(decryptSecret(integ.secret_enc) || "{}")
      clientId = p.client_id
      clientSecret = p.client_secret
      refreshToken = p.refresh_token
      publisherId = integ.config?.publisher_id
    } catch {
      // bozuk → env'e düş
    }
  }
  clientId = clientId || process.env.ADMOB_CLIENT_ID
  clientSecret = clientSecret || process.env.ADMOB_CLIENT_SECRET
  refreshToken = refreshToken || process.env.ADMOB_REFRESH_TOKEN
  publisherId = publisherId || process.env.ADMOB_PUBLISHER_ID

  if (
    !clientId ||
    !clientSecret ||
    !refreshToken ||
    !publisherId ||
    refreshToken.includes("placeholder")
  ) {
    logger.warn("[revenue] AdMob creds missing; skipping ad sync")
    return { synced: 0, skipped: 1 }
  }
  const apps = await service.listApps({}, { take: 500 })
  const byExt = new Map<string, string>()
  const byName = new Map<string, string>()
  for (const a of apps) {
    byName.set((a.name || "").toLowerCase(), a.id)
    const ids = a.external_ids?.admob ?? a.external_ids?.admob_app_ids
    if (Array.isArray(ids)) {
      ids.forEach((id: string) => byExt.set(id, a.id))
    } else if (typeof ids === "string") {
      byExt.set(ids, a.id)
    }
  }

  const connector = new AdMobConnector({
    clientId,
    clientSecret,
    refreshToken,
    publisherId,
  })
  const rows = await connector.fetchReport(28)

  // (app, platform) bazında topla
  const agg = new Map<
    string,
    { appId: string | null; platform: string; amount: number; currency: string; name: string }
  >()
  for (const r of rows) {
    const appId =
      byExt.get(r.appExternalId) ?? byName.get(r.appName.toLowerCase()) ?? null
    const key = `${appId ?? "?" + r.appName}|${r.platform}`
    const cur =
      agg.get(key) ?? {
        appId,
        platform: r.platform,
        amount: 0,
        currency: r.currency,
        name: r.appName,
      }
    cur.amount += r.amount
    agg.set(key, cur)
  }

  const today = new Date()
  let synced = 0
  let skipped = 0
  for (const v of agg.values()) {
    if (!v.appId) {
      logger.warn(`[revenue] AdMob app eşleşmedi: ${v.name}`)
      skipped++
      continue
    }
    await service.recordSnapshot({
      date: today,
      appId: v.appId,
      platform: v.platform,
      sourceType: "admob",
      fields: { ad_revenue: Number(v.amount.toFixed(2)), currency: v.currency },
    })
    synced++
  }
  logger.info(`[revenue] AdMob sync: ${synced} app/platform, ${skipped} unmatched`)
  return { synced, skipped }
}
