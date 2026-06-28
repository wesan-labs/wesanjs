import { MedusaService } from "@medusajs/framework/utils"
import SocialSnapshot from "./models/social-snapshot"

class SocialSnapshotModuleService extends MedusaService({
  SocialSnapshot,
}) {}

export default SocialSnapshotModuleService
