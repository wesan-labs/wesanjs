import { Badge, Button, Container, Heading, Input, Label, Text } from "@medusajs/ui"
import { useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  useCreateExpense,
  useRevenueOverview,
} from "../../hooks/api/revenue"
import { EmptyState, Money, Widget } from "../dashboards/kit"

const CATEGORIES = ["infra", "api", "ads", "other"] as const

const MetricCard = ({
  label,
  children,
  sub,
}: {
  label: string
  children: React.ReactNode
  sub?: string
}) => (
  <Container className="flex flex-col gap-y-2 p-6">
    <Text size="small" weight="plus" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Heading level="h1">{children}</Heading>
    {sub ? (
      <Text size="xsmall" className="text-ui-fg-muted">
        {sub}
      </Text>
    ) : null}
  </Container>
)

const ExpenseForm = ({ currency }: { currency: string }) => {
  const create = useCreateExpense()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "other",
    occurred_at: today,
  })

  const submit = () => {
    create.mutate(
      {
        description: form.description.trim(),
        amount: Number(form.amount),
        currency,
        category: form.category,
        occurred_at: form.occurred_at,
      },
      {
        onSuccess: () =>
          setForm({
            description: "",
            amount: "",
            category: "other",
            occurred_at: today,
          }),
      }
    )
  }

  const valid = form.description.trim().length > 0 && Number(form.amount) > 0

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">Açıklama</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Sunucu, API, reklam…"
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">Tutar ({currency})</Label>
        <Input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">Kategori</Label>
        <select
          className="bg-ui-bg-field border-ui-border-base h-8 rounded-md border px-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">Tarih</Label>
        <Input
          type="date"
          value={form.occurred_at}
          onChange={(e) => setForm({ ...form, occurred_at: e.target.value })}
        />
      </div>
      <Button onClick={submit} isLoading={create.isPending} disabled={!valid}>
        Gider Ekle
      </Button>
    </div>
  )
}

export const Component = () => {
  const { overview, isLoading, isError } = useRevenueOverview()

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-muted">
          Yükleniyor…
        </Text>
      </Container>
    )
  }

  if (isError || !overview) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-error">
          Revenue verisi alınamadı.
        </Text>
      </Container>
    )
  }

  const currency = overview.currency || "USD"

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">Revenue</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Abonelik geliri & gider — net P&L
          </Text>
        </div>
        <Badge size="2xsmall" color="green">
          RevenueCat + manuel gider
        </Badge>
      </Container>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="MRR" sub="Aylık yinelenen gelir">
          <Money amount={overview.mrr} currency={currency} />
        </MetricCard>
        <MetricCard label="Aktif Abonelik" sub="RevenueCat">
          {overview.activeSubscriptions.toLocaleString()}
        </MetricCard>
        <MetricCard label="28g Gelir" sub="Son 28 gün">
          <Money amount={overview.revenue28d} currency={currency} />
        </MetricCard>
        <MetricCard label="Net" sub="Gelir − gider">
          <Money amount={overview.net} currency={currency} />
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Widget title="MRR Trend">
          {overview.mrrTrend.length ? (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={overview.mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-ui-border-base" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState label="Henüz snapshot yok — günlük job çalışınca dolar" />
          )}
        </Widget>

        <Widget title="Son İşlemler">
          {overview.recentEvents.length ? (
            <div className="flex flex-col divide-y">
              {overview.recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex flex-col">
                    <Text size="small">{ev.kind}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {new Date(ev.occurred_at).toLocaleDateString()}
                    </Text>
                  </div>
                  <Text size="small" weight="plus">
                    <Money amount={ev.gross_amount} currency={ev.currency} />
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Henüz işlem yok — RevenueCat webhook bağlanınca dolar" />
          )}
        </Widget>
      </div>

      <Widget title="Gider Ekle">
        <ExpenseForm currency={currency} />
      </Widget>
    </div>
  )
}
