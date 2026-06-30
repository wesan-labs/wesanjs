import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms/types"
import type CmsModuleService from "../../../../modules/cms/service"
import {
  createCmsSiteWorkflow,
  type CreateCmsSiteInput,
} from "../../../../workflows/create-cms-site"

// GET /admin/cms/sites — siteleri listele
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [sites, count] = await service.listAndCountCmsSites(
    {},
    { order: { created_at: "DESC" } }
  )
  res.json({ sites, count })
}

// POST /admin/cms/sites — yeni site (workflow ile)
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = req.body as CreateCmsSiteInput
  const { result } = await createCmsSiteWorkflow(req.scope).run({
    input: body,
  })
  res.status(200).json({ site: result })
}
