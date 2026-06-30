import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms/types"
import type CmsModuleService from "../../../../../modules/cms/service"
import {
  updateCmsEntryWorkflow,
  type UpdateCmsEntryInput,
} from "../../../../../workflows/update-cms-entry"

// GET /admin/cms/entries/:id — tek entry (data dahil)
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const entry = await service.retrieveCmsEntry(id)
  res.json({ entry })
}

// POST /admin/cms/entries/:id — data ve/veya status güncelle (workflow)
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const body = req.body as Omit<UpdateCmsEntryInput, "id">
  const { result } = await updateCmsEntryWorkflow(req.scope).run({
    input: { id, ...body },
  })
  res.json({ entry: result })
}
