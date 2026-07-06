import {
  AccountAnalytics,
  PostAnalytics,
  PublishInput,
  PublishResult,
  SocialAccount,
  SocialProvider,
} from "./types"
import type { SocialRuntimeContext } from "./context"

const BASE = process.env.SOCIAL_API_BASE || "https://zernio.com/api/v1"

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0

export class SocialProviderError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message)
    this.name = "SocialProviderError"
  }
}

const mapAccount = (a: Record<string, any>): SocialAccount => ({
  id: a._id,
  platform: a.platform,
  username: a.username ?? null,
  displayName: a.displayName ?? null,
  followers: num(a.followersCount),
  posts: num(a.externalPostCount),
  avatar: a.profilePicture ?? null,
  profileUrl: a.profileUrl ?? null,
  enabled: a.enabled !== false,
  status: a.platformStatus ?? null,
})

const mapPost = (p: Record<string, any>): PostAnalytics => {
  const an = p.analytics || {}
  return {
    id: p._id,
    content: p.content ?? "",
    publishedAt: p.publishedAt ?? null,
    platform: p.platforms?.[0]?.platform ?? "",
    views: num(an.views),
    likes: num(an.likes),
    comments: num(an.comments),
    shares: num(an.shares),
    saves: num(an.saves),
    reach: num(an.reach),
    impressions: num(an.impressions),
    watchTime:
      num(an.igReelsAvgWatchTime ?? an.averageWatchTime ?? an.avgWatchTime) /
      1000,
    engagementRate: num(an.engagementRate),
  }
}

const round = (n: number, d = 2): number => Number(n.toFixed(d))

const accountProfileId = (a: Record<string, unknown>): string | undefined => {
  const raw =
    a.profileId ??
    a.profile_id ??
    (a.profile as { _id?: string } | undefined)?._id
  return typeof raw === "string" ? raw : undefined
}

/** Tenant-scoped Late/Zernio provider (profile + API key from context). */
export function createLateProvider(ctx: SocialRuntimeContext): SocialProvider {
  const call = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let res: Response
    try {
      res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${ctx.apiKey}`,
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      })
    } catch (e) {
      throw new SocialProviderError(
        `Late/Zernio API erişilemedi: ${(e as Error).message}`
      )
    }
    const text = await res.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    if (!res.ok) {
      const b = body as { error?: string; message?: string } | null
      const msg = b?.error || b?.message || `HTTP ${res.status}`
      throw new SocialProviderError(`Late/Zernio API: ${msg}`, res.status)
    }
    return body as T
  }

  return {
    name: "late",

    isConfigured: () => !!ctx.apiKey && !!ctx.profileId,

    async listAccounts() {
      const data = await call<{ accounts: Record<string, any>[] }>("/accounts")
      const accounts = (data.accounts || []).filter((a) => {
        const pid = accountProfileId(a)
        return !pid || pid === ctx.profileId
      })
      return accounts.map(mapAccount)
    },

    async connectUrl(platform: string) {
      const data = await call<{ authUrl: string }>(
        `/connect/${encodeURIComponent(platform)}?profileId=${ctx.profileId}`
      )
      return data.authUrl
    },

    async getAnalytics(accountId: string) {
      const data = await call<{ overview?: Record<string, any>; posts?: any[] }>(
        `/analytics?accountId=${encodeURIComponent(accountId)}`
      )
      const posts = (data.posts || []).map(mapPost)
      let totalViews = 0
      let totalReach = 0
      let totalLikes = 0
      let totalComments = 0
      let totalShares = 0
      let totalSaves = 0
      let watchSum = 0
      let watchCount = 0
      let topPost: PostAnalytics | null = null
      for (const p of posts) {
        totalViews += p.views
        totalReach += p.reach
        totalLikes += p.likes
        totalComments += p.comments
        totalShares += p.shares
        totalSaves += p.saves
        if (p.watchTime > 0) {
          watchSum += p.watchTime
          watchCount++
        }
        if (!topPost || p.views > topPost.views) topPost = p
      }
      const interactions = totalLikes + totalComments + totalShares + totalSaves
      const engagementRate = totalViews
        ? round((interactions / totalViews) * 100)
        : 0
      const saveRate = totalViews ? round((totalSaves / totalViews) * 1000, 1) : 0
      const shareRate = totalViews
        ? round((totalShares / totalViews) * 1000, 1)
        : 0
      const o = data.overview || {}
      return {
        overview: {
          totalPosts: num(o.totalPosts),
          publishedPosts: num(o.publishedPosts),
          scheduledPosts: num(o.scheduledPosts),
          lastSync: o.lastSync ?? null,
          totalViews,
          totalReach,
          totalLikes,
          totalComments,
          totalShares,
          totalSaves,
          engagementRate,
          saveRate,
          shareRate,
          avgWatchTime: watchCount ? round(watchSum / watchCount, 1) : 0,
          topPost,
        },
        posts,
      }
    },

    async publish(input: PublishInput): Promise<PublishResult> {
      const body: Record<string, unknown> = {
        content: input.content,
        platforms: input.targets,
      }
      if (input.isDraft) {
        body.isDraft = true
      } else if (input.scheduledFor) {
        body.scheduledFor = input.scheduledFor
        if (input.timezone) body.timezone = input.timezone
      } else {
        body.publishNow = true
      }
      if (input.mediaUrls?.length) body.mediaUrls = input.mediaUrls.join(",")

      const data = await call<Record<string, any>>("/posts", {
        method: "POST",
        body: JSON.stringify(body),
      })
      return {
        id: data?._id ?? data?.post?._id ?? null,
        status: data?.status ?? "submitted",
        raw: data,
      }
    },
  }
}
