import { MedusaService } from "@medusajs/framework/utils"
import CmsSite from "./models/cms-site"
import CmsCollection from "./models/cms-collection"
import CmsEntry from "./models/cms-entry"

// Auto-CRUD: createCmsSites/listCmsSites/... + Collections + Entries.
class CmsModuleService extends MedusaService({
  CmsSite,
  CmsCollection,
  CmsEntry,
}) {}

export default CmsModuleService
