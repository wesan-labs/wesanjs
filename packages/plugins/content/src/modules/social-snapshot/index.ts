import { Module } from "@medusajs/framework/utils"
import SocialSnapshotModuleService from "./service"

export const SOCIAL_SNAPSHOT_MODULE = "socialSnapshot"

export default Module(SOCIAL_SNAPSHOT_MODULE, {
  service: SocialSnapshotModuleService,
})
