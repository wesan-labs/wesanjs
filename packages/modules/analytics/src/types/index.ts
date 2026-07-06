import {
  ModuleProviderExports,
  ModuleServiceInitializeOptions,
} from "@medusajs/framework/types"
import type { PlatformAnalyticsInput } from "../lib/platform-config"

export type AnalyticsModuleOptions = Partial<ModuleServiceInitializeOptions> & {
  /**
   * Platform analytics — tek config bloğu (ops, bir kez).
   * Yoksa varsayılan `builtin`: veri Levios DB'de, tenant env yok.
   */
  platform?: PlatformAnalyticsInput
  providers?: {
    resolve: string | ModuleProviderExports
    id: string
    options?: Record<string, unknown>
  }[]
}

declare module "@medusajs/types" {
  interface ModuleOptions {
    "@medusajs/analytics": AnalyticsModuleOptions
    "@medusajs/medusa/analytics": AnalyticsModuleOptions
  }
}
