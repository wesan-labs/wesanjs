import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { useTenantQueryKey } from "./tenants"

export type AnalyticsVertical = "mobile_game" | "mobile_app" | "web"

export type AnalyticsProduct = {
  id: string
  name: string
  status: string
  vertical: AnalyticsVertical
  runtime?: string | null
  bootstrap_token_hint?: string | null
}

export type AnalyticsMetricPoint = {
  date: string
  value: number
}

export type AnalyticsOverview = {
  product_id: string
  vertical: AnalyticsVertical
  dau: number
  event_count: number
  crash_count: number
  crash_free_rate: number | null
  dau_trend: AnalyticsMetricPoint[]
  crash_trend: AnalyticsMetricPoint[]
  snapshot_days: number
  engine_ready: boolean
}

export const VERTICAL_LABELS: Record<AnalyticsVertical, string> = {
  mobile_game: "Mobil oyun",
  mobile_app: "Mobil uygulama",
  web: "Web",
}

export const useAnalyticsProducts = () => {
  const queryKey = useTenantQueryKey(["analytics", "products"])
  const { data, ...rest } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await sdk.client.fetch<{ products: AnalyticsProduct[] }>(
        "/admin/analytics/products"
      )
      return res.products ?? []
    },
  })

  return { products: data ?? [], ...rest }
}

export const useAnalyticsOverview = (productId?: string) => {
  const queryKey = useTenantQueryKey(["analytics", "overview", productId])
  const { data, ...rest } = useQuery({
    queryKey,
    enabled: !!productId,
    queryFn: async () => {
      const res = await sdk.client.fetch<{ overview: AnalyticsOverview }>(
        `/admin/analytics/overview?product_id=${encodeURIComponent(productId!)}`
      )
      return res.overview
    },
  })

  return { overview: data, ...rest }
}

export const useCreateAnalyticsProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; vertical?: AnalyticsVertical }) =>
      sdk.client.fetch<{ product: AnalyticsProduct }>(
        "/admin/analytics/products",
        {
          method: "POST",
          body: {
            name: body.name,
            vertical: body.vertical ?? "mobile_app",
          },
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics"] })
      qc.invalidateQueries({ queryKey: ["revenue"] })
    },
  })
}

export const useUpdateAnalyticsProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      vertical?: AnalyticsVertical
      runtime?: string | null
    }) =>
      sdk.client.fetch<{ product: AnalyticsProduct }>(
        `/admin/analytics/products/${input.id}`,
        {
          method: "PATCH",
          body: {
            vertical: input.vertical,
            runtime: input.runtime,
          },
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics"] })
      qc.invalidateQueries({ queryKey: ["revenue"] })
    },
  })
}

export const useRotateBootstrapToken = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) =>
      sdk.client.fetch<{
        token: string
        hint: string
        config_url: string
      }>(`/admin/analytics/products/${productId}/bootstrap`, {
        method: "POST",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics"] }),
  })
}

export type FunnelStep = {
  key: string
  label: string
  value: number
  rate_from_top: number
  rate_from_prev: number | null
}

export type AnalyticsFunnel = {
  product_id: string
  vertical: AnalyticsVertical
  date: string | null
  steps: FunnelStep[]
}

export const useAnalyticsFunnel = (productId?: string) => {
  const queryKey = useTenantQueryKey(["analytics", "funnel", productId])
  const { data, ...rest } = useQuery({
    queryKey,
    enabled: !!productId,
    queryFn: async () => {
      const res = await sdk.client.fetch<{ funnel?: AnalyticsFunnel } & AnalyticsFunnel>(
        `/admin/analytics/products/${productId}/funnel`
      )
      return ("funnel" in res && res.funnel ? res.funnel : res) as AnalyticsFunnel
    },
  })

  return { funnel: data, ...rest }
}

export const useSyncAnalytics = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (days?: number) =>
      sdk.client.fetch<{
        sync: {
          products: number
          days: number
          metrics_written: number
          mode: "builtin" | "hosted"
        }
      }>("/admin/analytics/sync", {
        method: "POST",
        query: days ? { days: String(days) } : undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics"] }),
  })
}
