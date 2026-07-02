import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms/types"
import type CmsModuleService from "../../../../../modules/cms/service"
import { tenantMismatch } from "../../../../lib/tenant-guard"

// GET /admin/cms/sites/:id — site + koleksiyonları + entry'leri
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)

  const site = await service.retrieveCmsSite(id)
  if (tenantMismatch(req, site)) {
    res.status(404).json({ type: "not_found", title: "Not Found" })
    return
  }
  const collections = await service.listCmsCollections({ site_id: id })
  const entries = await service.listCmsEntries({ site_id: id })

  res.json({ site, collections, entries })
}
