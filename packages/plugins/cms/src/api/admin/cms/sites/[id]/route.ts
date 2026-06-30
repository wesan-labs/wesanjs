import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms/types"
import type CmsModuleService from "../../../../../modules/cms/service"

// GET /admin/cms/sites/:id — site + koleksiyonları + entry'leri
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)

  const site = await service.retrieveCmsSite(id)
  const collections = await service.listCmsCollections({ site_id: id })
  const entries = await service.listCmsEntries({ site_id: id })

  res.json({ site, collections, entries })
}
