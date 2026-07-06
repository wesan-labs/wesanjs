import "./types"
import { Module, Modules } from "@medusajs/framework/utils"
import AnalyticsService from "./services/analytics-service"
import loadProviders from "./loaders/providers"
import loadPlatformConfig from "./loaders/platform-config"

export default Module(Modules.ANALYTICS, {
  service: AnalyticsService,
  loaders: [loadPlatformConfig, loadProviders],
})

export * from "./lib/sync"
export * from "./lib/platform-config"
