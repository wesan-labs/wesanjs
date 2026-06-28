import { MedusaContainer } from "@medusajs/framework/types"
import { getSocialProvider } from "./index"
import { SOCIAL_SNAPSHOT_MODULE } from "../../modules/social-snapshot"

/** UTC day key (YYYY-MM-DD) so re-runs on the same day upsert one row. */
const todayKey = (): string => new Date().toISOString().slice(0, 10)

export interface CaptureResult {
  captured: number
  skipped: number
  date: string
  reason?: string
}

/**
 * Capture one daily metrics snapshot per connected account. Idempotent per
 * (account, day): re-running the same day overwrites that day's row, so the
 * cron can fire often and restarts are safe. Builds the history the provider lacks.
 */
export async function captureSnapshots(
  container: MedusaContainer
): Promise<CaptureResult> {
  const date = todayKey()
  const provider = getSocialProvider()
  if (!provider.isConfigured()) {
    return { captured: 0, skipped: 0, date, reason: "provider not configured" }
  }

  const service = container.resolve(SOCIAL_SNAPSHOT_MODULE) as any
  const accounts = await provider.listAccounts()
  let captured = 0

  for (const a of accounts) {
    try {
      const { overview } = await provider.getAnalytics(a.id)
      const metrics = {
        followers: a.followers,
        postsCount: a.posts,
        totalViews: overview.totalViews,
        totalReach: overview.totalReach,
        totalLikes: overview.totalLikes,
        totalComments: overview.totalComments,
        totalShares: overview.totalShares,
        totalSaves: overview.totalSaves,
        engagementRate: overview.engagementRate,
        saveRate: overview.saveRate,
        shareRate: overview.shareRate,
        avgWatchTime: overview.avgWatchTime,
      }

      const existing = await service.listSocialSnapshots({ account_id: a.id, date })
      if (existing.length) {
        await service.updateSocialSnapshots({
          id: existing[0].id,
          platform: a.platform,
          metrics,
        })
      } else {
        await service.createSocialSnapshots({
          account_id: a.id,
          platform: a.platform,
          date,
          metrics,
        })
      }
      captured++
    } catch (e) {
      container
        .resolve("logger")
        .warn(`[social] snapshot failed for ${a.id}: ${(e as Error).message}`)
    }
  }

  return { captured, skipped: accounts.length - captured, date }
}
