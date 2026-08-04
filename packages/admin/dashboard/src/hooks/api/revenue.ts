import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { backendUrl, sdk, tenantHeaders } from "../../lib/client"
import { useFeatureFlag } from "../../providers/feature-flag-provider"
import { usePermissions } from "../../providers/permissions-provider"
import { useTenantQueryKey } from "./tenants"
import { useStore } from "./store"

// Sayfalardaki gösterim para birimi = store default (Money ile aynı kaynak).
export const useDisplayCurrency = (): string | undefined => {
  const { store } = useStore()
  return store?.supported_currencies?.find((c) => c.is_default)?.currency_code
}

export type RevenueEventRow = {
  id: string
  kind: string
  gross_amount: number
  currency: string
  occurred_at: string
}

export type RevenueOverview = {
  mrr: number
  activeSubscriptions: number
  revenue28d: number
  subscriptionRevenue: number
  subscriptionRevenueLastMonth: number
  adRevenueNow: number
  adRevenue: number
  adRevenueLastMonth: number
  adImpressions: number
  adEcpm: number
  commission: number
  taxTotal: number
  totalRevenue: number
  expenseTotal: number
  net: number
  currency: string
  expensesThisMonth?: {
    id: string
    description: string
    category: string
    amount: number
    currency: string
    occurred_at: string
    vendor?: string | null
    invoice_number?: string | null
    invoice_url?: string | null
  }[]
  activeTrials: number
  newCustomers: number
  activeUsers: number
  adByPlatform: {
    platform: string
    amount: number
    impressions: number
    ecpm: number
  }[]
  recentEvents: RevenueEventRow[]
  mrrTrend: { date: string; mrr: number }[]
  sync?: {
    revenuecatLastSyncedAt: string | null
    admobLastSyncedAt: string | null
    subscriptionDataThrough: string | null
    adDataThrough: string | null
  }
}

export type ChartPoint = { date: string; value: number; segment?: string }

export type ExpenseRow = {
  id: string
  description: string
  category: string
  amount: number
  currency: string
  occurred_at: string
  recurring: boolean
  vendor?: string | null
  invoice_number?: string | null
  invoice_url?: string | null
}

export type CreateExpenseInput = {
  description: string
  amount: number
  currency: string
  category: string
  occurred_at: string
  recurring: boolean
  vendor?: string | null
  invoice_number?: string | null
  invoice_url?: string | null
}

export type UpdateExpenseInput = {
  vendor?: string | null
  invoice_number?: string | null
  invoice_url?: string | null
  description?: string
  amount?: number
  currency?: string
  category?: string
  occurred_at?: string
  recurring?: boolean
}

export const revenueQueryKeys = {
  overview: ["revenue", "overview"] as const,
  expenses: ["revenue", "expenses"] as const,
}

export const useRevenueOverview = () => {
  const isRbacEnabled = useFeatureFlag("rbac")
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const canRead =
    !isRbacEnabled || (!permissionsLoading && hasPermission("revenue:read"))
  const display = useDisplayCurrency()
  const overviewKey = useTenantQueryKey([...revenueQueryKeys.overview, display ?? null])

  const { data, ...rest } = useQuery({
    queryKey: overviewKey,
    queryFn: async () => {
      const response = await sdk.client.fetch<{ overview: RevenueOverview }>(
        `/admin/revenue/overview${display ? `?display=${display}` : ""}`
      )
      return response.overview
    },
    enabled: canRead,
    retry: false,
  })

  return {
    overview: data,
    ...rest,
    isLoading: rest.isLoading || (isRbacEnabled && permissionsLoading),
  }
}

export type AdBreakdown = {
  currency: string
  daily: { date: string; ios: number; android: number; total: number }[]
  rows: {
    appId: string
    appName: string
    platform: string
    amount: number
    impressions: number
    ecpm: number
  }[]
}

export type FinanceSettings = {
  appleCommission: number
  googleCommission: number
  otherCommission: number
  taxRate: number
}

export const useFinanceSettings = () => {
  const { data, ...rest } = useQuery({
    queryKey: ["revenue", "settings"],
    queryFn: async () =>
      sdk.client.fetch<{ settings: FinanceSettings }>(
        "/admin/revenue/settings"
      ),
  })
  return { settings: data?.settings, ...rest }
}

export const useSaveFinanceSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Record<string, number>>) =>
      sdk.client.fetch("/admin/revenue/settings", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revenue", "settings"] })
      qc.invalidateQueries({ queryKey: revenueQueryKeys.overview })
    },
  })
}

export const useAdBreakdown = () => {
  const isRbacEnabled = useFeatureFlag("rbac")
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const canRead =
    !isRbacEnabled || (!permissionsLoading && hasPermission("revenue:read"))
  const display = useDisplayCurrency()

  const { data, ...rest } = useQuery({
    queryKey: ["revenue", "ad-breakdown", display ?? null],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ breakdown: AdBreakdown }>(
        `/admin/revenue/ad-breakdown${display ? `?display=${display}` : ""}`
      )
      return response.breakdown
    },
    enabled: canRead,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
  return { breakdown: data, ...rest }
}

export const useRevenueChart = (metric: string, segment?: string) => {
  const isRbacEnabled = useFeatureFlag("rbac")
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const canRead =
    !isRbacEnabled || (!permissionsLoading && hasPermission("revenue:read"))

  return useQuery({
    queryKey: ["revenue", "chart", metric, segment ?? null],
    queryFn: async () =>
      sdk.client.fetch<{ points: ChartPoint[]; segments: string[] }>(
        `/admin/revenue/charts/${metric}${segment ? `?segment=${segment}` : ""}`
      ),
    enabled: canRead,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export const useExpenses = () => {
  const { data, ...rest } = useQuery({
    queryKey: revenueQueryKeys.expenses,
    queryFn: async () =>
      sdk.client.fetch<{ expenses: ExpenseRow[] }>("/admin/revenue/expenses"),
  })

  return { expenses: data?.expenses ?? [], ...rest }
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateExpenseInput) =>
      sdk.client.fetch("/admin/revenue/expenses", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revenueQueryKeys.overview })
      queryClient.invalidateQueries({ queryKey: revenueQueryKeys.expenses })
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/revenue/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revenueQueryKeys.overview })
      queryClient.invalidateQueries({ queryKey: revenueQueryKeys.expenses })
    },
  })
}

export const uploadExpenseInvoice = async (
  file: File
): Promise<{ url: string; id: string }> => {
  const form = new FormData()
  form.append("file", file)
  const base = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`
  const res = await fetch(`${base}admin/revenue/expenses/invoice-upload`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers: { ...tenantHeaders },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(body.message ?? "Invoice upload failed")
  }
  return res.json()
}

export const useUploadExpenseInvoice = () =>
  useMutation({ mutationFn: uploadExpenseInvoice })

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateExpenseInput & { id: string }) =>
      sdk.client.fetch(`/admin/revenue/expenses/${id}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revenueQueryKeys.overview })
      queryClient.invalidateQueries({ queryKey: revenueQueryKeys.expenses })
    },
  })
}
