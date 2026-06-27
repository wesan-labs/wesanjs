import { Module } from "@medusajs/framework/utils"
import ContentLibraryModuleService from "./service"

export const CONTENT_LIBRARY_MODULE = "contentLibrary"

export default Module(CONTENT_LIBRARY_MODULE, {
  service: ContentLibraryModuleService,
})
