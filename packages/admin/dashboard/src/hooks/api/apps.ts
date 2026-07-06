import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { useTenantQueryKey } from "./tenants"
import { useDisplayCurrency } from "./revenue"

export type RevApp = {
  id: string
  name: string
  status: string
  vertical?: string | null
  runtime?: string | null
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
  adCurrency: string
  totalDisplay: number
  displayCurrency: string
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

const appsKeyBase = ["revenue", "apps"] as const
const sourcesKeyBase = ["revenue", "sources"] as const

export const useIntegrations = () => {
  const queryKey = useTenantQueryKey(["revenue", "integrations"])
  const { data, ...rest } = useQuery({
    queryKey,
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
  const display = useDisplayCurrency()
  const queryKey = useTenantQueryKey(["revenue", "apps-overview", display ?? null])
  const { data, ...rest } = useQuery({
    queryKey,
    queryFn: async () =>
      sdk.client.fetch<{ apps: AppOverviewRow[] }>(
        `/admin/revenue/apps-overview${display ? `?display=${display}` : ""}`
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
  const queryKey = useTenantQueryKey(["revenue", "app", id])
  const { data, ...rest } = useQuery({
    queryKey,
    queryFn: async () =>
      sdk.client.fetch<{ app: AppDetail }>(`/admin/revenue/apps/${id}`),
    enabled: !!id,
  })
  return { app: data?.app, ...rest }
}

export const useApps = () => {
  const queryKey = useTenantQueryKey(appsKeyBase)
  const { data, ...rest } = useQuery({
    queryKey,
    queryFn: async () => sdk.client.fetch<{ apps: RevApp[] }>("/admin/revenue/apps"),
  })
  return { apps: data?.apps ?? [], ...rest }
}

export const useCreateApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string }) =>
      sdk.client.fetch("/admin/revenue/apps", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: appsKeyBase }),
  })
}

export const useDeleteApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/revenue/apps/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appsKeyBase })
      qc.invalidateQueries({ queryKey: sourcesKeyBase })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: appsKeyBase }),
  })
}

export const useSources = () => {
  const queryKey = useTenantQueryKey(sourcesKeyBase)
  const { data, ...rest } = useQuery({
    queryKey,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: sourcesKeyBase }),
  })
}

export const useDeleteSource = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/revenue/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: sourcesKeyBase }),
  })
}
