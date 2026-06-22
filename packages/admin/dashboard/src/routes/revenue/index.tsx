import { Button, Container, Input, Label, Text } from "@medusajs/ui"
import { ReactNode, useState } from "react"
import {
  useCreateExpense,
  useExpenses,
  useRevenueChart,
  useRevenueOverview,
  type RevenueEventRow,
} from "../../hooks/api/revenue"
import {
  AreaChartPanel,
  BarList,
  centroidFor,
  DataTable,
  EmptyState,
  MapPanel,
  Money,
  StatCard,
  Widget,
  type MapMarker,
} from "../dashboards/kit"

const CATEGORIES = ["infra", "api", "ads", "other"] as const
const usd = (v: number) => `$${Number(v).toLocaleString()}`

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Text
    size="xsmall"
    weight="plus"
    className="text-ui-fg-muted px-1 pt-1 uppercase tracking-wider"
  >
    {children}
  </Text>
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
      <div className="flex min-w-40 flex-1 flex-col gap-y-1">
        <Label size="xsmall">Açıklama</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Sunucu, API, reklam…"
        />
      </div>
      <div className="flex w-24 flex-col gap-y-1">
        <Label size="xsmall">Tutar</Label>
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
        Ekle
      </Button>
    </div>
  )
}

export const Component = () => {
  const { overview, isLoading, isError } = useRevenueOverview()
  const revenueChart = useRevenueChart("revenue")
  const platformChart = useRevenueChart("revenue", "store")
  const countryChart = useRevenueChart("revenue", "country")
  const { expenses } = useExpenses()

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

  const countryEntries = Object.entries(
    (countryChart.data?.points ?? []).reduce<Record<string, number>>(
      (acc, p) => {
        const seg = p.segment ?? "Total"
        acc[seg] = (acc[seg] ?? 0) + p.value
        return acc
      },
      {}
    )
  )
    .filter(([name]) => name !== "Total")
    .sort((a, b) => b[1] - a[1])

  const mapMarkers: MapMarker[] = []
  const unmappedCountries: string[] = []
  countryEntries.forEach(([name, value]) => {
    const c = centroidFor(name)
    if (c) {
      mapMarkers.push({ lng: c[0], lat: c[1], label: name, value, display: usd(value) })
    } else {
      unmappedCountries.push(name)
    }
  })
  const countryItems = countryEntries.map(([name, value]) => ({
    label: name,
    value,
    display: <Money amount={value} currency={currency} />,
  }))

  const num = (n?: number) => (n ?? 0).toLocaleString()

  return (
    <div className="flex flex-col gap-y-2">
      {/* PARA */}
      <SectionLabel>Para</SectionLabel>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard
          label="MRR"
          sub="Aylık yinelenen"
          value={<Money amount={overview.mrr} currency={currency} />}
        />
        <StatCard
          label="28g Gelir"
          sub="Son 28 gün"
          trend={revenueSeries}
          value={<Money amount={overview.revenue28d} currency={currency} />}
        />
        <StatCard
          label="Net Kâr"
          sub="Gelir − gider"
          accent={overview.net >= 0 ? "positive" : "negative"}
          value={<Money amount={overview.net} currency={currency} />}
        />
        <StatCard
          label="Toplam Gider"
          sub="Tüm zamanlar"
          value={<Money amount={overview.expenseTotal} currency={currency} />}
        />
      </div>

      {/* KİTLE */}
      <SectionLabel>Kitle</SectionLabel>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard label="Aktif Abonelik" sub="Şu an" value={num(overview.activeSubscriptions)} />
        <StatCard label="Trial" sub="Şu an" value={num(overview.activeTrials)} />
        <StatCard label="Yeni Müşteri" sub="Son 28 gün" value={num(overview.newCustomers)} />
        <StatCard label="Aktif Kullanıcı" sub="Son 28 gün" value={num(overview.activeUsers)} />
      </div>

      {/* GRAFİK + PLATFORM */}
      <div className="mt-1 grid grid-cols-1 gap-2 xl:grid-cols-3">
        <Widget title="Gelir Trendi" className="xl:col-span-2">
          {revenuePoints.length ? (
            <AreaChartPanel
              data={revenuePoints}
              xKey="date"
              yKey="value"
              valueFormatter={usd}
            />
          ) : (
            <div className="text-ui-fg-muted flex h-[240px] items-center justify-center text-sm">
              Henüz veri yok
            </div>
          )}
        </Widget>
        <Widget title="Platforma Göre Gelir">
          <BarList items={platformItems} emptyLabel="Platform verisi yok" />
        </Widget>
      </div>

      {/* ÖDEME BÖLGELERİ */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <Widget title="Ödeme Bölgeleri" className="xl:col-span-2">
          {mapMarkers.length ? (
            <MapPanel markers={mapMarkers} />
          ) : (
            <div className="text-ui-fg-muted flex h-[320px] items-center justify-center text-sm">
              Henüz ödeme bölgesi yok
            </div>
          )}
        </Widget>
        <Widget title="Ülkeye Göre Gelir">
          <BarList items={countryItems} emptyLabel="Ülke verisi yok" />
          {unmappedCountries.length ? (
            <Text size="xsmall" className="text-ui-fg-muted mt-2">
              Haritada gösterilemeyen: {unmappedCountries.join(", ")}
            </Text>
          ) : null}
        </Widget>
      </div>

      {/* DEFTER */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
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

        <Widget title="Giderler">
          <div className="flex flex-col gap-y-4">
            <ExpenseForm currency={currency} />
            {expenses.length ? (
              <div className="flex flex-col divide-y">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <Text size="small" className="truncate">
                        {e.description}
                      </Text>
                      <Text size="xsmall" className="text-ui-fg-muted">
                        {e.category} · {new Date(e.occurred_at).toLocaleDateString()}
                      </Text>
                    </div>
                    <Text size="small" weight="plus" className="shrink-0">
                      <Money amount={e.amount} currency={e.currency} />
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="Henüz gider yok" />
            )}
          </div>
        </Widget>
      </div>
    </div>
  )
}
