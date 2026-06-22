import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const sources = await service.listRevenueSources(
    {},
    { order: { name: "ASC" }, take: 200 }
  )
  res.status(200).json({ sources })
}

// credentials_ref = sırrın TUTULDUĞU .env değişken adı (sır DB'de DEĞİL).
const PostSource = z.object({
  type: z.enum(["revenuecat", "stripe", "paddle", "iyzico", "manual"]),
  name: z.string().min(1),
  app_id: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  credentials_ref: z.string().nullable().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = PostSource.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const source = await service.createRevenueSources(body)
  res.status(201).json({ source })
}
