import { Module } from "@medusajs/framework/utils"
import RevenueModuleService from "./service"
import { REVENUE_MODULE } from "./types"

export default Module(REVENUE_MODULE, {
  service: RevenueModuleService,
})
