import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import { encryptSecret } from "../../../../modules/revenue/lib/crypto"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const raw = await service.listRevenueSources(
    {},
    { order: { name: "ASC" }, take: 200 }
  )
  // secret_enc ASLA dışarı dönmez — sadece "kayıtlı mı" bilgisi.
  const sources = raw.map((s: any) => ({
    ...s,
    secret_enc: undefined,
    hasSecret: !!s.secret_enc || !!s.credentials_ref,
  }))
  res.status(200).json({ sources })
}

// secret = UI'dan girilen ham anahtar (şifrelenip secret_enc'e yazılır).
// credentials_ref = alternatif: anahtarın .env'deki değişken adı.
const PostSource = z.object({
  type: z.enum(["revenuecat", "stripe", "paddle", "iyzico", "manual"]),
  name: z.string().min(1),
  app_id: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  credentials_ref: z.string().nullable().optional(),
  secret: z.string().nullable().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { secret, ...rest } = PostSource.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const created = await service.createRevenueSources({
    ...rest,
    secret_enc: secret ? encryptSecret(secret) : null,
  })
  res.status(201).json({
    source: {
      ...created,
      secret_enc: undefined,
      hasSecret: !!created.secret_enc || !!created.credentials_ref,
    },
  })
}
