import { MedusaService } from "@medusajs/framework/utils"
import ContentItem from "./models/content-item"

class ContentLibraryModuleService extends MedusaService({
  ContentItem,
}) {}

export default ContentLibraryModuleService
