import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import {
  listWithLegacyTenantScope,
  stampTenantId,
  tenantScopeFilter,
} from "../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const apps = await listWithLegacyTenantScope(
    req,
    (filter, config) => service.listApps(filter, config),
    { order: { name: "ASC" }, take: 200 }
  )
  res.status(200).json({ apps })
}

const PostApp = z.object({
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
  const body = PostApp.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const app = await service.createApps(stampTenantId(req, body))
  res.status(201).json({ app })
}
