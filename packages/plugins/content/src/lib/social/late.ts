import {
  AccountAnalytics,
  PostAnalytics,
  PublishInput,
  PublishResult,
  SocialAccount,
  SocialProvider,
} from "./types"

/**
 * Late / Zernio provider (getlate.dev → zernio.com). One API key (Bearer sk_…)
 * drives connect/list/publish/analytics; the service owns each platform's OAuth.
 * Verified contract: GET /profiles, /accounts, /connect/{platform}?profileId=,
 * /analytics?accountId=, POST /posts. Base https://zernio.com/api/v1.
 */

const BASE = process.env.SOCIAL_API_BASE || "https://zernio.com/api/v1"
const apiKey = (): string =>
  process.env.ZERNIO_API_KEY || process.env.LATE_API_KEY || ""

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0

export class SocialProviderError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message)
    this.name = "SocialProviderError"
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = apiKey()
  if (!key) {
    throw new SocialProviderError(
      "ZERNIO_API_KEY tanımlı değil — sosyal entegrasyon yapılandırılmamış.",
      400
    )
  }
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
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

// Profile id is stable per key; cache it to skip a round-trip on connect.
let cachedProfileId: string | null = null
async function defaultProfileId(): Promise<string> {
  if (cachedProfileId) return cachedProfileId
  const data = await call<{ profiles: { _id: string; isDefault?: boolean }[] }>(
    "/profiles"
  )
  const list = data.profiles || []
  const p = list.find((x) => x.isDefault) || list[0]
  if (!p) throw new SocialProviderError("Hiç Late/Zernio profili yok.", 400)
  cachedProfileId = p._id
  return p._id
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
    // Watch time only surfaces for video/reels; provider reports it in MS → seconds.
    watchTime:
      num(an.igReelsAvgWatchTime ?? an.averageWatchTime ?? an.avgWatchTime) /
      1000,
    engagementRate: num(an.engagementRate),
  }
}

const round = (n: number, d = 2): number =>
  Number(n.toFixed(d))

export const lateProvider: SocialProvider = {
  name: "late",

  isConfigured: () => !!apiKey(),

  async listAccounts() {
    const data = await call<{ accounts: Record<string, any>[] }>("/accounts")
    return (data.accounts || []).map(mapAccount)
  },

  async connectUrl(platform: string) {
    const profileId = await defaultProfileId()
    const data = await call<{ authUrl: string }>(
      `/connect/${encodeURIComponent(platform)}?profileId=${profileId}`
    )
    return data.authUrl
  },

  async getAnalytics(accountId: string) {
    const data = await call<{ overview?: Record<string, any>; posts?: any[] }>(
      `/analytics?accountId=${encodeURIComponent(accountId)}`
    )
    const posts = (data.posts || []).map(mapPost)
    // Aggregates derived in one O(n) pass over the post list (small: per account).
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
    // Engagement against views (matches the provider's per-post convention).
    const engagementRate = totalViews ? round((interactions / totalViews) * 100) : 0
    // Virality signals normalized per 1,000 views.
    const saveRate = totalViews ? round((totalSaves / totalViews) * 1000, 1) : 0
    const shareRate = totalViews ? round((totalShares / totalViews) * 1000, 1) : 0
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
