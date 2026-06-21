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
  useRevenueChart,
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

const RevenueTrend = () => {
  const { data, isLoading } = useRevenueChart("revenue")
  const points = data?.points ?? []

  if (isLoading) {
    return <EmptyState label="Yükleniyor…" />
  }
  if (!points.length) {
    return <EmptyState label="Henüz veri yok" />
  }

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={points}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-ui-border-base"
          />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const PlatformBreakdown = ({ currency }: { currency: string }) => {
  const { data, isLoading } = useRevenueChart("revenue", "store")

  if (isLoading) {
    return <EmptyState label="Yükleniyor…" />
  }

  const totals = (data?.points ?? []).reduce<Record<string, number>>(
    (acc, p) => {
      const seg = p.segment ?? "Total"
      acc[seg] = (acc[seg] ?? 0) + p.value
      return acc
    },
    {}
  )
  const platforms = Object.entries(totals)
    .filter(([name]) => name !== "Total")
    .sort((a, b) => b[1] - a[1])

  if (!platforms.length) {
    return <EmptyState label="Platform verisi yok" />
  }

  return (
    <div className="flex flex-col divide-y">
      {platforms.map(([name, value]) => (
        <div key={name} className="flex items-center justify-between py-2">
          <Text size="small">{name}</Text>
          <Text size="small" weight="plus">
            <Money amount={value} currency={currency} />
          </Text>
        </div>
      ))}
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
        <MetricCard label="Yeni Müşteri" sub="Son 28 gün">
          {overview.newCustomers.toLocaleString()}
        </MetricCard>
        <MetricCard label="Aktif Kullanıcı" sub="Son 28 gün">
          {overview.activeUsers.toLocaleString()}
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Widget title="Gelir Trendi (günlük)" className="xl:col-span-2">
          <RevenueTrend />
        </Widget>
        <Widget title="Platforma Göre Gelir">
          <PlatformBreakdown currency={currency} />
        </Widget>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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

        <Widget title="Gider Ekle">
          <ExpenseForm currency={currency} />
        </Widget>
      </div>
    </div>
  )
}
