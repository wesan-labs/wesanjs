import type { MedusaContainer } from "@medusajs/framework/types"
import { syncAnalyticsSnapshots } from "../api/lib/analytics-sync"

export default async function syncAnalyticsJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  try {
    await syncAnalyticsSnapshots(container)
    logger.info("[analytics] daily sync completed")
  } catch (e) {
    logger.error(
      `[analytics] SYNC FAILED: ${e instanceof Error ? e.message : String(e)}`
    )
    throw e
  }
}

export const config = {
  name: "analytics-sync-snapshots",
  schedule: "15 3 * * *",
}
