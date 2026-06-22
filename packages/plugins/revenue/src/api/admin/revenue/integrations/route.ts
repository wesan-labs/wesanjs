import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import { encryptSecret } from "../../../../modules/revenue/lib/crypto"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

const envSet = (name: string) => {
  const v = process.env[name]
  return !!v && !v.includes("placeholder")
}

// GET — entegrasyon durumu (stored row + env fallback). Secret asla dönmez.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const sources = await service.listRevenueSources({}, { take: 500 })
  const rc = sources.filter((s: any) => s.type === "revenuecat")
  const byProvider = (p: string) =>
    sources.find((s: any) => s.provider === p && !!s.secret_enc)
  const admob = byProvider("admob")
  const email = byProvider("resend")

  res.status(200).json({
    integrations: {
      revenuecat: {
        connected: rc.length > 0,
        apps: new Set(rc.map((s: any) => s.app_id).filter(Boolean)).size,
        sources: rc.length,
      },
      admob: {
        connected: !!admob || envSet("ADMOB_REFRESH_TOKEN"),
        publisherId: admob?.config?.publisher_id ?? null,
        note: "Tek hesap; OAuth (client id/secret + refresh token).",
      },
      email: {
        connected: !!email || envSet("RESEND_API_KEY"),
        recipient:
          email?.config?.recipient || process.env.REVENUE_REPORT_EMAIL || null,
        from: email?.config?.from ?? null,
        note: "Aylık P&L raporu için sağlayıcı (Resend).",
      },
    },
  })
}

// POST — account-level entegrasyon kaydet. secrets şifreli (JSON), config açık.
const PostIntegration = z.object({
  provider: z.enum(["admob", "resend"]),
  category: z.enum(["ads", "mail"]),
  config: z.record(z.string(), z.any()).nullable().optional(),
  secrets: z.record(z.string(), z.string()),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = PostIntegration.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  // provider başına tek kayıt: varsa güncelle, yoksa oluştur
  const existing = (await service.listRevenueSources({}, { take: 500 })).find(
    (s: any) => s.provider === body.provider
  )
  const data = {
    type: "manual",
    provider: body.provider,
    category: body.category,
    name: body.provider,
    config: body.config ?? {},
    secret_enc: encryptSecret(JSON.stringify(body.secrets)),
  }
  if (existing) {
    await service.updateRevenueSources({ id: existing.id, ...data })
  } else {
    await service.createRevenueSources(data)
  }
  res.status(201).json({ ok: true, provider: body.provider })
}
