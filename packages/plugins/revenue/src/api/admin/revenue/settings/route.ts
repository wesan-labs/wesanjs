import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import {
  getTenantId,
  stampTenantId,
  tenantScopeFilter,
} from "../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

// Finans ayarları: platform komisyonları + vergi oranı (yüzde). Secret yok.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const settings = await service.getSettings(getTenantId(req))
  res.status(200).json({ settings })
}

const PostSettings = z.object({
  apple_commission: z.number().min(0).max(100).optional(),
  google_commission: z.number().min(0).max(100).optional(),
  other_commission: z.number().min(0).max(100).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = PostSettings.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const existing = (
    await service.listRevenueSources(tenantScopeFilter(req), { take: 500 })
  ).find((s: any) => s.provider === "settings")
  const config = { ...(existing?.config ?? {}), ...body }
  if (existing) {
    await service.updateRevenueSources({ id: existing.id, config })
  } else {
    await service.createRevenueSources(
      stampTenantId(req, {
        type: "manual",
        provider: "settings",
        category: "finance",
        name: "settings",
        config,
      })
    )
  }
  res.status(201).json({ ok: true })
}
