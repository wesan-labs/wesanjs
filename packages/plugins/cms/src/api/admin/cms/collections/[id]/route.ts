import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms/types"
import type CmsModuleService from "../../../../../modules/cms/service"
import { tenantMismatch } from "../../../../lib/tenant-guard"
import {
  updateCmsCollectionWorkflow,
  type UpdateCmsCollectionInput,
} from "../../../../../workflows/update-cms-collection"

// GET /admin/cms/collections/:id — tek koleksiyon (schema dahil)
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const collection = await service.retrieveCmsCollection(id)
  if (tenantMismatch(req, collection)) {
    res.status(404).json({ type: "not_found", title: "Not Found" })
    return
  }
  res.json({ collection })
}

// POST /admin/cms/collections/:id — schema (içerik-modeli) ve/veya label güncelle
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const existing = await service.retrieveCmsCollection(id)
  if (tenantMismatch(req, existing)) {
    res.status(404).json({ type: "not_found", title: "Not Found" })
    return
  }
  const body = req.body as Omit<UpdateCmsCollectionInput, "id">
  const { result } = await updateCmsCollectionWorkflow(req.scope).run({
    input: { id, ...body },
  })
  res.json({ collection: result })
}
