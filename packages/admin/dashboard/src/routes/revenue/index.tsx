import { Badge, Button, Container, Heading, Input, Label, Text } from "@medusajs/ui"
import { useState } from "react"
import {
  useCreateExpense,
  useRevenueChart,
  useRevenueOverview,
  type RevenueEventRow,
} from "../../hooks/api/revenue"
import {
  AreaChartPanel,
  BarList,
  DataTable,
  Money,
  StatCard,
  Widget,
} from "../dashboards/kit"

const CATEGORIES = ["infra", "api", "ads", "other"] as const
const usd = (v: number) => `$${Number(v).toLocaleString()}`

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
  const revenueChart = useRevenueChart("revenue")
  const mrrChart = useRevenueChart("mrr")
  const platformChart = useRevenueChart("revenue", "store")

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
          Revenue verisi alınamadı. Backend çalışıyor mu kontrol et.
        </Text>
      </Container>
    )
  }

  const currency = overview.currency || "USD"
  const revenuePoints = revenueChart.data?.points ?? []
  const revenueSeries = revenuePoints.map((p) => p.value)
  const mrrSeries = (mrrChart.data?.points ?? []).map((p) => p.value)

  const platformTotals = (platformChart.data?.points ?? []).reduce<
    Record<string, number>
  >((acc, p) => {
    const seg = p.segment ?? "Total"
    acc[seg] = (acc[seg] ?? 0) + p.value
    return acc
  }, {})
  const platformItems = Object.entries(platformTotals)
    .filter(([name]) => name !== "Total")
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      label: name,
      value,
      display: <Money amount={value} currency={currency} />,
    }))

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">Revenue</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Uygulama portföyü — abonelik geliri, gider ve net kâr
          </Text>
        </div>
        <Badge size="2xsmall" color="green">
          RevenueCat · canlı
        </Badge>
      </Container>

      {/* Hero — the two numbers a founder reads first */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatCard
          label="MRR"
          size="hero"
          sub="Aylık yinelenen gelir"
          trend={mrrSeries}
          value={<Money amount={overview.mrr} currency={currency} />}
        />
        <StatCard
          label="Net Kâr"
          size="hero"
          sub="Gelir − gider (28 gün)"
          accent={overview.net >= 0 ? "positive" : "negative"}
          value={<Money amount={overview.net} currency={currency} />}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktif Abonelik"
          sub="Şu an"
          value={overview.activeSubscriptions.toLocaleString()}
        />
        <StatCard
          label="28g Gelir"
          sub="Son 28 gün"
          trend={revenueSeries}
          value={<Money amount={overview.revenue28d} currency={currency} />}
        />
        <StatCard
          label="Yeni Müşteri"
          sub="Son 28 gün"
          value={overview.newCustomers.toLocaleString()}
        />
        <StatCard
          label="Aktif Kullanıcı"
          sub="Son 28 gün"
          value={overview.activeUsers.toLocaleString()}
        />
      </div>

      {/* Signature — revenue trend + platform split */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Widget title="Gelir Trendi" className="xl:col-span-2">
          {revenuePoints.length ? (
            <AreaChartPanel
              data={revenuePoints}
              xKey="date"
              yKey="value"
              valueFormatter={usd}
            />
          ) : (
            <div className="text-ui-fg-muted flex h-[260px] items-center justify-center text-sm">
              Henüz veri yok
            </div>
          )}
        </Widget>
        <Widget title="Platforma Göre Gelir">
          <BarList items={platformItems} emptyLabel="Platform verisi yok" />
        </Widget>
      </div>

      {/* Detail — transactions + expense entry */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Widget title="Son İşlemler">
          <DataTable<RevenueEventRow>
            columns={[
              { key: "kind", header: "Tür", render: (r) => r.kind },
              {
                key: "date",
                header: "Tarih",
                render: (r) => new Date(r.occurred_at).toLocaleDateString(),
              },
              {
                key: "amount",
                header: "Tutar",
                align: "right",
                render: (r) => (
                  <Money amount={r.gross_amount} currency={r.currency} />
                ),
              },
            ]}
            rows={overview.recentEvents}
            emptyLabel="Henüz işlem yok — webhook bağlanınca dolacak"
          />
        </Widget>
        <Widget title="Gider Ekle">
          <ExpenseForm currency={currency} />
        </Widget>
      </div>
    </div>
  )
}
