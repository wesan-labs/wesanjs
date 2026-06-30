import { Module } from "@medusajs/framework/utils"
import CmsModuleService from "./service"
import { CMS_MODULE } from "./types"

export default Module(CMS_MODULE, {
  service: CmsModuleService,
})
