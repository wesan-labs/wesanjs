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
  // İstenen rapor para birimi (UI'dan; boşsa AdMob hesabının yerel birimi).
  const currency = integ?.config?.currency || process.env.ADMOB_CURRENCY

  const apps = await service.listApps({}, { take: 500 })
  const byExt = new Map<string, string>()
  const byName = new Map<string, string>()
  for (const a of apps) {
    byName.set((a.name || "").toLowerCase(), a.id)
    // Android + iOS ayrı app id'leri; her ikisi de aynı ürüne eşlenir.
    const ext = a.external_ids ?? {}
    const ids = [
      ext.admob_android,
      ext.admob_ios,
      ext.admob, // legacy (string | string[])
      ext.admob_app_ids,
    ].flat()
    for (const id of ids) {
      if (typeof id === "string" && id.trim()) byExt.set(id.trim(), a.id)
    }
  }

  const connector = new AdMobConnector({
    clientId,
    clientSecret,
    refreshToken,
    publisherId,
    currency,
  })
  // Geçen ayın 1'inden bugüne — takvim-ayı (Bu ay / Geçen ay) için yeterli.
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const rows = await connector.fetchReport(start, now)

  // AdMob DATE "YYYYMMDD" → Date (gün başı).
  const parseDay = (s: string): Date | null => {
    if (/^\d{8}$/.test(s)) {
      return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`)
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  // GÜN GÜN sakla: (app, platform, gün) bazında — takvim-ayı doğru toplansın.
  const agg = new Map<
    string,
    {
      appId: string | null
      platform: string
      day: Date
      amount: number
      impressions: number
      currency: string
      name: string
    }
  >()
  for (const r of rows) {
    const appId =
      byExt.get(r.appExternalId) ?? byName.get(r.appName.toLowerCase()) ?? null
    const day = parseDay(r.date)
    if (!day) {
      continue
    }
    const key = `${appId ?? "?" + r.appName}|${r.platform}|${r.date}`
    const cur =
      agg.get(key) ?? {
        appId,
        platform: r.platform,
        day,
        amount: 0,
        impressions: 0,
        currency: r.currency,
        name: r.appName,
      }
    cur.amount += r.amount
    cur.impressions += r.impressions
    agg.set(key, cur)
  }

  let synced = 0
  let skipped = 0
  const unmatched = new Set<string>()
  for (const v of agg.values()) {
    if (!v.appId) {
      unmatched.add(v.name)
      skipped++
      continue
    }
    await service.recordSnapshot({
      date: v.day,
      appId: v.appId,
      platform: v.platform,
      sourceType: "admob",
      fields: {
        ad_revenue: Number(v.amount.toFixed(2)),
        ad_impressions: v.impressions,
        currency: v.currency,
      },
    })
    synced++
  }
  for (const name of unmatched) {
    logger.warn(`[revenue] AdMob app eşleşmedi: ${name}`)
  }
  logger.info(`[revenue] AdMob sync: ${synced} app/platform, ${skipped} unmatched`)
  return { synced, skipped }
}
