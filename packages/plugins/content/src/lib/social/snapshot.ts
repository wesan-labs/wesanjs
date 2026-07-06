import type { MedusaContainer } from "@medusajs/framework/types"
import type { SocialProvider } from "./types"
import { SOCIAL_SNAPSHOT_MODULE } from "../../modules/social-snapshot"
import {
  getSocialProviderForTenant,
  platformZernioApiKey,
} from "./index"

const todayKey = (): string => new Date().toISOString().slice(0, 10)

export interface CaptureResult {
  captured: number
  skipped: number
  date: string
  reason?: string
}

async function captureForProvider(
  container: MedusaContainer,
  provider: SocialProvider,
  tenantId: string | null
): Promise<CaptureResult> {
  const date = todayKey()
  const service = container.resolve(SOCIAL_SNAPSHOT_MODULE) as {
    listSocialSnapshots: (f: object, c?: object) => Promise<{ id: string }[]>
    updateSocialSnapshots: (d: object) => Promise<unknown>
    createSocialSnapshots: (d: object) => Promise<unknown>
  }
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

      const filter: Record<string, unknown> = { account_id: a.id, date }
      if (tenantId) filter.tenant_id = tenantId
      const existing = await service.listSocialSnapshots(filter)
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
          tenant_id: tenantId,
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

/** Snapshot all tenants that have a Zernio profile (cron). */
export async function captureSnapshots(
  container: MedusaContainer
): Promise<CaptureResult> {
  const date = todayKey()
  if (!platformZernioApiKey()) {
    return { captured: 0, skipped: 0, date, reason: "platform key missing" }
  }

  const TENANT_MODULE = "tenant"
  let tenants: { id: string }[] = []
  try {
    const tenantService = container.resolve(TENANT_MODULE) as {
      listTenants: (f: object, c?: object) => Promise<{ id: string }[]>
    }
    tenants = await tenantService.listTenants({}, { take: 500 })
  } catch {
    return { captured: 0, skipped: 0, date, reason: "tenant module unavailable" }
  }

  let captured = 0
  let skipped = 0
  for (const t of tenants) {
    const provider = await getSocialProviderForTenant(container, t.id)
    if (!provider) {
      continue
    }
    const r = await captureForProvider(container, provider, t.id)
    captured += r.captured
    skipped += r.skipped
  }

  return { captured, skipped, date }
}

/** Manual snapshot for one org (admin POST). */
export async function captureTenantSnapshots(
  container: MedusaContainer,
  tenantId: string
): Promise<CaptureResult> {
  const date = todayKey()
  const provider = await getSocialProviderForTenant(container, tenantId)
  if (!provider) {
    return {
      captured: 0,
      skipped: 0,
      date,
      reason: "tenant social not configured",
    }
  }
  return captureForProvider(container, provider, tenantId)
}
