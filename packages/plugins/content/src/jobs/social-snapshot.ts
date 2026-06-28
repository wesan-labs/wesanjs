import { MedusaContainer } from "@medusajs/framework/types"
import { captureSnapshots } from "../lib/social/snapshot"

// Persists a daily metrics snapshot per connected account so the dashboard can
// show real trends + time-series (the provider only returns current totals).
export default async function socialSnapshotJob(container: MedusaContainer) {
  const r = await captureSnapshots(container)
  container
    .resolve("logger")
    .info(
      `[social] snapshot ${r.date}: ${r.captured} captured, ${r.skipped} skipped${
        r.reason ? ` (${r.reason})` : ""
      }`
    )
}

export const config = {
  name: "social-daily-snapshot",
  // Every 6h; upserts by UTC day, so we keep a fresh same-day value + survive restarts.
  schedule: "0 */6 * * *",
}
