import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import type { AnalyticsVertical } from "../../../lib/analytics-overview"
import {
  getTenantId,
  listWithLegacyTenantScope,
  stampTenantId,
  tenantMismatch,
  tenantScopeFilter,
} from "../../../lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

const normalizeVertical = (value?: string | null): AnalyticsVertical => {
  if (value === "mobile_game" || value === "web") {
    return value
  }
  return "mobile_app"
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const revenue: any = req.scope.resolve(REVENUE_MODULE)
  const analytics: any = req.scope.resolve(Modules.ANALYTICS)
  const tenantId = getTenantId(req)

  const apps = await listWithLegacyTenantScope(
    req,
    (filter, config) => revenue.listApps(filter, config),
    { order: { name: "ASC" }, take: 200 }
  )

  const products = await Promise.all(
    apps.map(async (app: any) => ({
      id: app.id,
      name: app.name,
      status: app.status,
      vertical: normalizeVertical(app.vertical),
      runtime: app.runtime ?? null,
      bootstrap_token_hint: await analytics.getBootstrapHint(tenantId, app.id),
    }))
  )

  res.status(200).json({ products })
}

const PostProduct = z.object({
  name: z.string().min(1),
  vertical: z.enum(["mobile_game", "mobile_app", "web"]).optional(),
  runtime: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  external_ids: z.record(z.string(), z.any()).nullable().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = PostProduct.parse(req.body)
  const revenue: any = req.scope.resolve(REVENUE_MODULE)
  const app = await revenue.createApps(
    stampTenantId(req, {
      ...body,
      vertical: body.vertical ?? "mobile_app",
    })
  )
  res.status(201).json({
    product: {
      id: app.id,
      name: app.name,
      status: app.status,
      vertical: normalizeVertical(app.vertical),
      runtime: app.runtime ?? null,
      bootstrap_token_hint: null,
    },
  })
}
