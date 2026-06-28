/**
 * Provider-agnostic social layer. A SocialProvider wraps a hosted aggregator
 * (Late/Zernio today) that owns per-platform OAuth + token storage, so we call
 * one API with one key for connect/list/publish/analytics across 13 platforms.
 */

export interface SocialAccount {
  id: string
  platform: string
  username: string | null
  displayName: string | null
  followers: number
  posts: number
  avatar: string | null
  profileUrl: string | null
  enabled: boolean
  status: string | null
}

export interface PostAnalytics {
  id: string
  content: string
  publishedAt: string | null
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  /** seconds; provider only fills this for video/reels, else 0 */
  watchTime: number
  engagementRate: number
}

export interface AccountAnalytics {
  overview: {
    totalPosts: number
    publishedPosts: number
    scheduledPosts: number
    lastSync: string | null
    totalViews: number
    totalReach: number
    totalLikes: number
    totalComments: number
    totalShares: number
    totalSaves: number
    /** (likes+comments+shares+saves) / views · 100 — quality, compare to platform benchmark */
    engagementRate: number
    /** saves per 1,000 views — "lasting value" virality signal */
    saveRate: number
    /** shares per 1,000 views — strongest discovery signal */
    shareRate: number
    /** avg seconds watched across posts that report it (0 = unavailable) */
    avgWatchTime: number
    topPost: PostAnalytics | null
  }
  posts: PostAnalytics[]
}

export interface PublishInput {
  content: string
  targets: { platform: string; accountId: string }[]
  mediaUrls?: string[]
  /** ISO datetime; when omitted the post is published immediately. */
  scheduledFor?: string
  timezone?: string
}

export interface PublishResult {
  id: string | null
  status: string
  raw?: unknown
}

export interface SocialProvider {
  readonly name: string
  isConfigured(): boolean
  listAccounts(): Promise<SocialAccount[]>
  /** Returns a hosted OAuth URL; the end user authorizes there, provider stores the token. */
  connectUrl(platform: string): Promise<string>
  getAnalytics(accountId: string): Promise<AccountAnalytics>
  publish(input: PublishInput): Promise<PublishResult>
}
