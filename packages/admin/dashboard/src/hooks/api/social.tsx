import { useMutation, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

/**
 * Social hooks — talk to the content plugin's provider proxy
 * (`/admin/content/social/*`, backed by Late/Zernio). Accounts + analytics are
 * read live; connect returns a hosted OAuth URL the UI opens in a new tab.
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
    engagementRate: number
    saveRate: number
    shareRate: number
    avgWatchTime: number
    topPost: PostAnalytics | null
  }
  posts: PostAnalytics[]
}

export const useSocialAccounts = () =>
  useQuery({
    queryKey: ["social", "accounts"],
    queryFn: () =>
      sdk.client.fetch<{
        accounts: SocialAccount[]
        configured: boolean
        imageHost?: boolean
      }>("/admin/content/social/accounts"),
    staleTime: 30_000,
  })

export const useSocialAnalytics = (accountId?: string) =>
  useQuery({
    queryKey: ["social", "analytics", accountId],
    queryFn: () =>
      sdk.client.fetch<{ analytics: AccountAnalytics }>(
        `/admin/content/social/analytics?accountId=${accountId}`
      ),
    enabled: !!accountId,
    staleTime: 60_000,
  })

export interface SocialSnapshot {
  date: string
  metrics: {
    followers: number
    totalViews: number
    totalLikes: number
    totalShares: number
    totalSaves: number
    engagementRate: number
    [k: string]: number
  }
}

/** Daily metric history (snapshot job) for trend lines; empty until ≥1 day captured. */
export const useSocialTrends = (accountId?: string) =>
  useQuery({
    queryKey: ["social", "trends", accountId],
    queryFn: () =>
      sdk.client.fetch<{
        snapshots: SocialSnapshot[]
        trend: Record<string, number> | null
      }>(`/admin/content/social/trends?accountId=${accountId}`),
    enabled: !!accountId,
    staleTime: 60_000,
  })

/** Returns the hosted OAuth URL for a platform so the caller can open it. */
export const useConnectSocial = () =>
  useMutation({
    mutationFn: (platform: string) =>
      sdk.client.fetch<{ authUrl: string }>(
        `/admin/content/social/connect/${platform}`
      ),
  })

export interface PublishTarget {
  platform: string
  accountId: string
}
export interface PublishInput {
  content: string
  targets: PublishTarget[]
  mediaUrls?: string[]
  /** local data URLs hosted publicly server-side before publishing */
  mediaDataUrls?: string[]
  isDraft?: boolean
  scheduledFor?: string
}

/** Publish (or draft/schedule) a post to selected connected accounts. */
export const usePublishSocial = () =>
  useMutation({
    mutationFn: (input: PublishInput) =>
      sdk.client.fetch<{ result: { id: string | null; status: string } }>(
        "/admin/content/social/publish",
        { method: "POST", body: input }
      ),
  })
