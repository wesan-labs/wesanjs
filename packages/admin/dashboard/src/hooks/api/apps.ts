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
  status: string
  last_synced_at?: string | null
  last_error?: string | null
}

const appsKey = ["revenue", "apps"] as const
const sourcesKey = ["revenue", "sources"] as const

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
