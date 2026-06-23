// AdMob connector — TEK hesap, per-app/platform reklam geliri.
// Auth: Google OAuth (service account YOK) → refresh token ile access token.
// Rapor: networkReport:generate (DATE+APP+PLATFORM, ESTIMATED_EARNINGS, micros).
export type AdRow = {
  date: string
  appExternalId: string
  appName: string
  platform: string
  amount: number
  currency: string
}

export const microsToAmount = (micros: number | string): number =>
  Number((Number(micros) / 1_000_000).toFixed(2))

export const admobPlatform = (p: string): string => {
  const s = (p || "").toLowerCase()
  if (s.includes("ios") || s.includes("apple")) return "ios"
  if (s.includes("android")) return "android"
  return s || "all"
}

export class AdMobConnector {
  constructor(
    private opts: {
      clientId: string
      clientSecret: string
      refreshToken: string
      publisherId: string
      currency?: string
    }
  ) {}

  private async accessToken(): Promise<string> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.opts.clientId,
        client_secret: this.opts.clientSecret,
        refresh_token: this.opts.refreshToken,
        grant_type: "refresh_token",
      }),
    })
    if (!res.ok) {
      throw new Error(`AdMob token failed: ${res.status} ${await res.text()}`)
    }
    const data: any = await res.json()
    return data.access_token
  }

  // Son `days` günün app×platform reklam gelirini döner.
  async fetchReport(days = 28): Promise<AdRow[]> {
    const token = await this.accessToken()
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    const ymd = (d: Date) => ({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    })
    const res = await fetch(
      `https://admob.googleapis.com/v1/accounts/${this.opts.publisherId}/networkReport:generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportSpec: {
            dateRange: { startDate: ymd(start), endDate: ymd(end) },
            dimensions: ["DATE", "APP", "PLATFORM"],
            metrics: ["ESTIMATED_EARNINGS"],
            // İstenen para birimi (boşsa AdMob hesabının yerel birimi, ör. TRY).
            ...(this.opts.currency
              ? { localizationSettings: { currencyCode: this.opts.currency } }
              : {}),
          },
        }),
      }
    )
    if (!res.ok) {
      throw new Error(`AdMob report failed: ${res.status} ${await res.text()}`)
    }
    const body: any = await res.json()
    return parseAdmobReport(body)
  }
}

// Rapor yanıtı: [{header:{localizationSettings:{currencyCode}}}, {row:{...}}, …, {footer}]
export function parseAdmobReport(body: any): AdRow[] {
  const arr = Array.isArray(body) ? body : []
  let currency = "USD"
  const rows: AdRow[] = []
  for (const item of arr) {
    if (item?.header?.localizationSettings?.currencyCode) {
      currency = item.header.localizationSettings.currencyCode
    }
    const r = item?.row
    if (!r) continue
    const dv = r.dimensionValues ?? {}
    const date = dv.DATE?.value ?? ""
    const app = dv.APP ?? {}
    const platform = admobPlatform(dv.PLATFORM?.value ?? "")
    const micros = r.metricValues?.ESTIMATED_EARNINGS?.microsValue ?? 0
    rows.push({
      date,
      appExternalId: app.value ?? "",
      appName: app.displayLabel ?? app.value ?? "",
      platform,
      amount: microsToAmount(micros),
      currency,
    })
  }
  return rows
}
