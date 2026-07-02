import { MedusaContainer } from "@medusajs/framework/types"
import { syncAdmob } from "../modules/revenue/lib/sync-admob"

// Saatlik: tek AdMob hesabından per-app/platform reklam gelirini senkronlar.
// Fail SESSİZ ölmez: yapısal error log + rethrow (job runner fail kaydı).
// A9 alert merkezi geldiğinde catch bloğu alert de yazacak.
export default async function syncAdmobJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  try {
    await syncAdmob(container)
    logger.info("[revenue] sync done (admob)")
  } catch (e) {
    logger.error(
      `[revenue] SYNC FAILED (admob): ${
        e instanceof Error ? e.message : String(e)
      }`
    )
    throw e
  }
}

export const config = {
  name: "revenue-sync-admob",
  schedule: "0 * * * *",
}
