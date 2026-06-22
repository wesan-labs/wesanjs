import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

// Entegrasyon durumu — SADECE durum/sayım + .env değişken ADLARI döner.
// Hiçbir secret değeri dönmez (sır .env'de kalır).
const isSet = (name: string) => {
  const v = process.env[name]
  return !!v && !v.includes("placeholder")
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const sources = await service.listRevenueSources({}, { take: 500 })
  const rcSources = sources.filter((s: any) => s.type === "revenuecat")
  const connectedApps = new Set(
    rcSources.map((s: any) => s.app_id).filter(Boolean)
  )

  res.status(200).json({
    integrations: {
      revenuecat: {
        connected: rcSources.length > 0,
        apps: connectedApps.size,
        sources: rcSources.length,
      },
      admob: {
        connected: isSet("ADMOB_REFRESH_TOKEN"),
        envVars: ["ADMOB_REFRESH_TOKEN", "ADMOB_PUBLISHER_ID"],
        note: "Tek hesap; OAuth refresh token (basit key yok).",
      },
      email: {
        connected: isSet("RESEND_API_KEY"),
        recipient: process.env.REVENUE_REPORT_EMAIL || null,
        envVars: ["RESEND_API_KEY", "REVENUE_REPORT_EMAIL"],
        note: "Aylık P&L raporu için sağlayıcı.",
      },
    },
  })
}
