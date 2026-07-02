import { MedusaContainer } from "@medusajs/framework/types"
import { syncRevenuecatSources } from "../modules/revenue/lib/sync"

// Saatlik: kayıtlı tüm RevenueCat kaynaklarını per-app/platform senkronlar.
// Fail SESSİZ ölmez: yapısal error log + rethrow (job runner fail kaydı).
// A9 alert merkezi geldiğinde catch bloğu alert de yazacak.
export default async function syncRevenuecat(container: MedusaContainer) {
  const logger = container.resolve("logger")
  try {
    const { synced, skipped } = await syncRevenuecatSources(container)
    logger.info(`[revenue] sync done: ${synced} synced, ${skipped} skipped`)
  } catch (e) {
    logger.error(
      `[revenue] SYNC FAILED (revenuecat): ${
        e instanceof Error ? e.message : String(e)
      }`
    )
    throw e
  }
}

export const config = {
  name: "revenue-sync-revenuecat",
  schedule: "0 * * * *", // saatlik; snapshot güne göre upsert
}
