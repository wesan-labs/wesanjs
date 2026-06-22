import { Container, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useAppsOverview, type AppOverviewRow } from "../../hooks/api/apps"
import {
  useRevenueChart,
  useRevenueOverview,
  type RevenueEventRow,
} from "../../hooks/api/revenue"
import {
  AreaChartPanel,
  BarList,
  centroidFor,
  DataTable,
  MapPanel,
  Money,
  StatCard,
  Widget,
  type MapMarker,
} from "../dashboards/kit"

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

export const Component = () => {
  const { overview, isLoading, isError } = useRevenueOverview()
  const revenueChart = useRevenueChart("revenue")
  const platformChart = useRevenueChart("revenue", "store")
  const countryChart = useRevenueChart("revenue", "country")
  const { apps } = useAppsOverview()

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

  const platformItems = Object.entries(
    (platformChart.data?.points ?? []).reduce<Record<string, number>>(
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

      {/* UYGULAMALAR (per-app kırılım) */}
      <div className="mt-1">
        <Widget title="Uygulamalar">
          <DataTable<AppOverviewRow>
            columns={[
              {
                key: "name",
                header: "Uygulama",
                render: (a) => (
                  <Link
                    to={`/apps/${a.id}`}
                    className="text-ui-fg-interactive hover:underline"
                  >
                    {a.name}
                  </Link>
                ),
              },
              {
                key: "mrr",
                header: "MRR",
                align: "right",
                render: (a) => <Money amount={a.mrr} currency={a.currency} />,
              },
              {
                key: "rev",
                header: "28g Gelir",
                align: "right",
                render: (a) => (
                  <Money amount={a.revenue28d} currency={a.currency} />
                ),
              },
              {
                key: "ad",
                header: "Reklam",
                align: "right",
                render: (a) => (
                  <Money amount={a.adRevenue} currency={a.currency} />
                ),
              },
              {
                key: "subs",
                header: "Abone",
                align: "right",
                render: (a) => a.activeSubscriptions.toLocaleString(),
              },
            ]}
            rows={apps}
            emptyLabel="Henüz ürün yok — Ayarlar → Bağlantılar'dan ekle"
          />
        </Widget>
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
              render: (r) => <Money amount={r.gross_amount} currency={r.currency} />,
            },
          ]}
          rows={overview.recentEvents}
          emptyLabel="Henüz işlem yok — webhook bağlanınca dolacak"
        />
      </Widget>
    </div>
  )
}
