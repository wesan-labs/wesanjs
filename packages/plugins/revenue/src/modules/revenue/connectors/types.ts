import { RevenueEventKind, RevenueSourceType } from "../types"

export type CanonicalEvent = {
  externalId: string
  kind: RevenueEventKind
  grossAmount: number
  currency: string
  occurredAt: Date
  raw: unknown
}

export type ProviderMetrics = {
  mrr: number
  activeSubscriptions: number
  activeTrials: number
  revenue28d: number
  currency: string
  newCustomers: number
  activeUsers: number
}

export type ChartPoint = { date: string; value: number; segment?: string }

export interface RevenueConnector {
  type: RevenueSourceType
  fetchMetrics?(): Promise<ProviderMetrics>
  parseWebhook?(body: unknown): CanonicalEvent[]
  verifyWebhook?(headers: Record<string, string | undefined>, body: unknown): boolean
  fetchChart?(metric: string, opts?: { segment?: string }): Promise<{ points: ChartPoint[]; segments: string[] }>
}
