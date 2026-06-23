import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import { REVENUE_MODULE } from "../../../../../modules/revenue/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const app = await service.getAppDetail(req.params.id)
  res.status(200).json({ app })
}

const UpdateApp = z.object({
  name: z.string().min(1).optional(),
  external_ids: z.record(z.string(), z.any()).nullable().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = UpdateApp.parse(req.body)
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const app = await service.updateApps({ id: req.params.id, ...body })
  res.status(200).json({ app })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  await service.deleteApps(req.params.id)
  res.status(200).json({ id: req.params.id, object: "app", deleted: true })
}
