import { MedusaContainer } from "@medusajs/framework/types"
import { syncAdmob } from "../modules/revenue/lib/sync-admob"

// Saatlik: tek AdMob hesabından per-app/platform reklam gelirini senkronlar.
export default async function syncAdmobJob(container: MedusaContainer) {
  await syncAdmob(container)
}

export const config = {
  name: "revenue-sync-admob",
  schedule: "0 * * * *",
}
