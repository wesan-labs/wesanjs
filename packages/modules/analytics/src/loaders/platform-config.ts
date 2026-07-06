import { LoaderOptions } from "@medusajs/framework/types"
import {
  setPlatformAnalyticsConfig,
  type PlatformAnalyticsInput,
} from "../lib/platform-config"
import type { AnalyticsModuleOptions } from "../types"

export default async ({
  options,
}: LoaderOptions<AnalyticsModuleOptions>): Promise<void> => {
  setPlatformAnalyticsConfig(options?.platform as PlatformAnalyticsInput)
}
