import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import {
  decryptSecret,
  encryptSecret,
} from "../../../../modules/revenue/lib/crypto"
import {
  listWithLegacyTenantScope,
  stampTenantId,
  tenantScopeFilter,
} from "../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

const envSet = (name: string) => {
  const v = process.env[name]
  return !!v && !v.includes("placeholder")
}

// Hangi secret alanları dolu — değer dönmeden "kayıtlı" durumunu göstermek için.
const secretsSet = (s: any): string[] => {
  if (!s?.secret_enc) return []
  try {
    const obj = JSON.parse(decryptSecret(s.secret_enc) || "{}")
    return Object.entries(obj)
      .filter(([, v]) => !!v)
      .map(([k]) => k)
  } catch {
    return []
  }
}

// GET — entegrasyon durumu (stored row + env fallback). Secret asla dönmez.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const sources: any[] = await listWithLegacyTenantScope(
    req,
    (filter, config) => service.listRevenueSources(filter, config),
    { take: 500 }
  )
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
        currency: admob?.config?.currency ?? null,
        secretsSet: secretsSet(admob),
        note: "Tek hesap; OAuth (client id/secret + refresh token).",
      },
      email: {
        connected: !!email || envSet("RESEND_API_KEY"),
        recipient:
          email?.config?.recipient || process.env.REVENUE_REPORT_EMAIL || null,
        from: email?.config?.from ?? null,
        secretsSet: secretsSet(email),
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
  secrets: z.record(z.string(), z.string()).optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = PostIntegration.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const existing: any = (
    await listWithLegacyTenantScope(req, (filter, config) =>
      service.listRevenueSources(filter, config)
    )
  ).find((s: any) => s.provider === body.provider)

  // MERGE — boş gönderilen alan mevcut değeri SİLMEZ; sadece yeni gireni günceller.
  let mergedSecrets: Record<string, string> = {}
  if (existing?.secret_enc) {
    try {
      mergedSecrets = JSON.parse(decryptSecret(existing.secret_enc) || "{}")
    } catch {
      mergedSecrets = {}
    }
  }
  for (const [k, v] of Object.entries(body.secrets ?? {})) {
    if (typeof v === "string" && v.trim()) mergedSecrets[k] = v.trim()
  }
  const mergedConfig = { ...(existing?.config ?? {}), ...(body.config ?? {}) }

  const data = {
    type: "manual",
    provider: body.provider,
    category: body.category,
    name: body.provider,
    config: mergedConfig,
    secret_enc: encryptSecret(JSON.stringify(mergedSecrets)),
  }
  if (existing) {
    await service.updateRevenueSources({ id: existing.id, ...data })
  } else {
    await service.createRevenueSources(stampTenantId(req, data))
  }
  res.status(201).json({ ok: true, provider: body.provider })
}
