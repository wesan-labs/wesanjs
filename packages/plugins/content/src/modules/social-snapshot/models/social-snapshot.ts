import { model } from "@medusajs/framework/utils"

/**
 * A daily metrics snapshot for one connected social account. The provider
 * (Late/Zernio) exposes only current totals — no history — so we persist one
 * row per (account, day) to derive trends + time-series the live API can't give.
 * `metrics` holds the full overview blob (followers, views, engagement, rates…).
 */
const SocialSnapshot = model.define("social_snapshot", {
  id: model.id().primaryKey(),
  account_id: model.text(),
  platform: model.text(),
  /** snapshot day, UTC YYYY-MM-DD — unique per account for idempotent upsert */
  date: model.text(),
  metrics: model.json(),
})

export default SocialSnapshot
