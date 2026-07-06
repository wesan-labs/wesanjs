import { MedusaService } from "@medusajs/framework/utils"
import ContentConnection from "./models/content-connection"

class ContentConnectionModuleService extends MedusaService({
  ContentConnection,
}) {}

export default ContentConnectionModuleService
