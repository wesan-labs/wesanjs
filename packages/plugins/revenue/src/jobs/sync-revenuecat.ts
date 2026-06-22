import { MedusaContainer } from "@medusajs/framework/types"
import { syncRevenuecatSources } from "../modules/revenue/lib/sync"

// Saatlik: kayıtlı tüm RevenueCat kaynaklarını per-app/platform senkronlar.
export default async function syncRevenuecat(container: MedusaContainer) {
  const { synced, skipped } = await syncRevenuecatSources(container)
  container
    .resolve("logger")
    .info(`[revenue] sync done: ${synced} synced, ${skipped} skipped`)
}

export const config = {
  name: "revenue-sync-revenuecat",
  schedule: "0 * * * *", // saatlik; snapshot güne göre upsert
}
