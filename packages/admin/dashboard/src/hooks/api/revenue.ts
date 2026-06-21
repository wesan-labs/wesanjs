import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

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
  expenseTotal: number
  net: number
  currency: string
  newCustomers: number
  activeUsers: number
  recentEvents: RevenueEventRow[]
  mrrTrend: { date: string; mrr: number }[]
}

export type ChartPoint = { date: string; value: number; segment?: string }

export type CreateExpenseInput = {
  description: string
  amount: number
  currency: string
  category: string
  occurred_at: string
}

export const revenueQueryKeys = {
  overview: ["revenue", "overview"] as const,
}

export const useRevenueOverview = () => {
  const { data, ...rest } = useQuery({
    queryKey: revenueQueryKeys.overview,
    queryFn: async () =>
      sdk.client.fetch<{ overview: RevenueOverview }>(
        "/admin/revenue/overview"
      ),
  })

  return { overview: data?.overview, ...rest }
}

export const useRevenueChart = (metric: string, segment?: string) => {
  return useQuery({
    queryKey: ["revenue", "chart", metric, segment ?? null],
    queryFn: async () =>
      sdk.client.fetch<{ points: ChartPoint[]; segments: string[] }>(
        `/admin/revenue/charts/${metric}${
          segment ? `?segment=${segment}` : ""
        }`
      ),
    staleTime: 5 * 60 * 1000,
  })
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
    },
  })
}
