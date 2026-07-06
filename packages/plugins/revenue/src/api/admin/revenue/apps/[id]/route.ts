import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import {
  getTenantId,
  stampTenantId,
  tenantMismatch,
  tenantScopeFilter,
} from "../../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../../modules/revenue/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const tenantId = getTenantId(req)
  const [app] = await service.listApps(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!app || tenantMismatch(req, app)) {
    return res.status(404).json({ message: "App not found" })
  }
  const detail = await service.getAppDetail(req.params.id, tenantId)
  res.status(200).json({ app: detail })
}

const UpdateApp = z.object({
  name: z.string().min(1).optional(),
  vertical: z.enum(["mobile_game", "mobile_app", "web"]).optional(),
  runtime: z.string().nullable().optional(),
  external_ids: z.record(z.string(), z.any()).nullable().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = UpdateApp.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const [existing] = await service.listApps(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!existing || tenantMismatch(req, existing)) {
    return res.status(404).json({ message: "App not found" })
  }
  const app = await service.updateApps({ id: req.params.id, ...body })
  res.status(200).json({ app })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const [existing] = await service.listApps(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!existing || tenantMismatch(req, existing)) {
    return res.status(404).json({ message: "App not found" })
  }
  await service.deleteApps(req.params.id)
  res.status(200).json({ id: req.params.id, object: "app", deleted: true })
}
