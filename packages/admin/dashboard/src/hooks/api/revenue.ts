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
  recentEvents: RevenueEventRow[]
  mrrTrend: { date: string; mrr: number }[]
}

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
