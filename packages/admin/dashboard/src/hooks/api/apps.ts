import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

export type RevApp = {
  id: string
  name: string
  status: string
  icon_url?: string | null
  external_ids?: Record<string, unknown> | null
}

export type RevSource = {
  id: string
  type: string
  name: string
  app_id?: string | null
  external_id?: string | null
  credentials_ref?: string | null
  hasSecret?: boolean
  status: string
  last_synced_at?: string | null
  last_error?: string | null
}

export type AppOverviewRow = {
  id: string
  name: string
  mrr: number
  revenue28d: number
  adRevenue: number
  activeSubscriptions: number
  newCustomers: number
  activeUsers: number
  currency: string
  lastSyncedDate?: string | null
}

export type Integrations = {
  revenuecat: { connected: boolean; apps: number; sources: number }
  admob: {
    connected: boolean
    publisherId: string | null
    currency: string | null
    secretsSet: string[]
    note: string
  }
  email: {
    connected: boolean
    recipient: string | null
    from: string | null
    secretsSet: string[]
    note: string
  }
}

const appsKey = ["revenue", "apps"] as const
const sourcesKey = ["revenue", "sources"] as const

export const useIntegrations = () => {
  const { data, ...rest } = useQuery({
    queryKey: ["revenue", "integrations"],
    queryFn: async () =>
      sdk.client.fetch<{ integrations: Integrations }>(
        "/admin/revenue/integrations"
      ),
  })
  return { integrations: data?.integrations, ...rest }
}

export type SyncResult = {
  revenuecat: { synced: number; skipped: number }
  admob: { synced: number; skipped: number }
}

export const useSync = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<SyncResult>("/admin/revenue/sync", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenue"] }),
  })
}

export const useSaveIntegration = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      provider: string
      category: string
      config?: Record<string, unknown>
      secrets: Record<string, string>
    }) =>
      sdk.client.fetch("/admin/revenue/integrations", {
        method: "POST",
        body,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["revenue", "integrations"] }),
  })
}

export const useAppsOverview = () => {
  const { data, ...rest } = useQuery({
    queryKey: ["revenue", "apps-overview"],
    queryFn: async () =>
      sdk.client.fetch<{ apps: AppOverviewRow[] }>(
        "/admin/revenue/apps-overview"
      ),
  })
  return { apps: data?.apps ?? [], ...rest }
}

export type AppDetail = AppOverviewRow & {
  activeTrials: number
  lastSyncedDate?: string | null
  platforms: {
    platform: string
    source_type: string
    revenue: number
    currency: string
  }[]
}

export const useAppDetail = (id: string) => {
  const { data, ...rest } = useQuery({
    queryKey: ["revenue", "app", id],
    queryFn: async () =>
      sdk.client.fetch<{ app: AppDetail }>(`/admin/revenue/apps/${id}`),
    enabled: !!id,
  })
  return { app: data?.app, ...rest }
}

export const useApps = () => {
  const { data, ...rest } = useQuery({
    queryKey: appsKey,
    queryFn: async () => sdk.client.fetch<{ apps: RevApp[] }>("/admin/revenue/apps"),
  })
  return { apps: data?.apps ?? [], ...rest }
}

export const useCreateApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string }) =>
      sdk.client.fetch("/admin/revenue/apps", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: appsKey }),
  })
}

export const useDeleteApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/revenue/apps/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appsKey })
      qc.invalidateQueries({ queryKey: sourcesKey })
    },
  })
}

export const useUpdateApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      name?: string
      external_ids?: Record<string, unknown>
    }) =>
      sdk.client.fetch(`/admin/revenue/apps/${id}`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: appsKey }),
  })
}

export const useSources = () => {
  const { data, ...rest } = useQuery({
    queryKey: sourcesKey,
    queryFn: async () =>
      sdk.client.fetch<{ sources: RevSource[] }>("/admin/revenue/sources"),
  })
  return { sources: data?.sources ?? [], ...rest }
}

export const useCreateSource = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      type: string
      name: string
      app_id?: string | null
      external_id?: string | null
      credentials_ref?: string | null
      secret?: string | null
    }) => sdk.client.fetch("/admin/revenue/sources", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: sourcesKey }),
  })
}

export const useDeleteSource = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/revenue/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: sourcesKey }),
  })
}
