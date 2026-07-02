import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms/types"
import type CmsModuleService from "../../../../../modules/cms/service"
import { tenantMismatch } from "../../../../lib/tenant-guard"
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
  if (tenantMismatch(req, entry)) {
    res.status(404).json({ type: "not_found", title: "Not Found" })
    return
  }
  res.json({ entry })
}

// POST /admin/cms/entries/:id — data ve/veya status güncelle (workflow)
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const existing = await service.retrieveCmsEntry(id)
  if (tenantMismatch(req, existing)) {
    res.status(404).json({ type: "not_found", title: "Not Found" })
    return
  }
  const body = req.body as Omit<UpdateCmsEntryInput, "id">
  const { result } = await updateCmsEntryWorkflow(req.scope).run({
    input: { id, ...body },
  })
  res.json({ entry: result })
}
