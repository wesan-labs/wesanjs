import { Module } from "@medusajs/framework/utils"
import ContentConnectionModuleService from "./service"

export const CONTENT_CONNECTION_MODULE = "contentConnection"

export default Module(CONTENT_CONNECTION_MODULE, {
  service: ContentConnectionModuleService,
})
