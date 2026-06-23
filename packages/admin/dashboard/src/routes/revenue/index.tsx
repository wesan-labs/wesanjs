import { Container, Tabs, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useAppsOverview, type AppOverviewRow } from "../../hooks/api/apps"
import {
  useRevenueChart,
  useRevenueOverview,
  type RevenueEventRow,
  type RevenueOverview,
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
// RevenueCat grafik/segment verisi USD (abonelik native) — Money buradan display'e çevirir.
const RC = "USD"

const prettyPlatform = (p: string) =>
  p === "ios" ? "iOS" : p === "android" ? "Android" : p || "—"

/* P&L denklemi: Toplam (Abonelik+Reklam) − Gider = Net */
const PnlFig = ({
  label,
  children,
  accent,
  strong,
}: {
  label: string
  children: ReactNode
  accent?: "positive" | "negative"
  strong?: boolean
}) => (
  <div className="flex flex-col gap-y-0.5">
    <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wider">
      {label}
    </Text>
    <span
      className={
        (strong ? "text-xl font-semibold " : "text-base font-medium ") +
        (accent === "positive"
          ? "text-ui-tag-green-text"
          : accent === "negative"
            ? "text-ui-tag-red-text"
            : "text-ui-fg-base")
      }
    >
      {children}
    </span>
  </div>
)

const Op = ({ children }: { children: ReactNode }) => (
  <span className="text-ui-fg-muted self-center text-lg">{children}</span>
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

  const cur = overview.currency || "USD"
  const revenuePoints = revenueChart.data?.points ?? []

  const aggregate = (points: { segment?: string; value: number }[]) =>
    Object.entries(
      points.reduce<Record<string, number>>((acc, p) => {
        const seg = p.segment ?? "Total"
        acc[seg] = (acc[seg] ?? 0) + p.value
        return acc
      }, {})
    )
      .filter(([name]) => name !== "Total")
      .sort((a, b) => b[1] - a[1])

  const platformItems = aggregate(platformChart.data?.points ?? []).map(
    ([label, value]) => ({
      label,
      value,
      display: <Money amount={value} currency={RC} />,
    })
  )

  const countryEntries = aggregate(countryChart.data?.points ?? [])
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
    display: <Money amount={value} currency={RC} />,
  }))

  const adByAppItems = apps
    .filter((a) => a.adRevenue > 0)
    .map((a) => ({
      label: a.name,
      value: a.adRevenue,
      display: <Money amount={a.adRevenue} currency={a.adCurrency} />,
    }))
    .sort((a, b) => b.value - a.value)

  const num = (n?: number) => (n ?? 0).toLocaleString()

  return (
    <div className="flex flex-col gap-y-3">
      {/* P&L ŞERİDİ */}
      <Container className="flex flex-wrap items-stretch gap-x-7 gap-y-4 p-5">
        <PnlFig label="Toplam Gelir" strong>
          <Money amount={overview.totalRevenue} currency={cur} />
        </PnlFig>
        <Op>=</Op>
        <PnlFig label="Abonelik">
          <Money amount={overview.subscriptionRevenue} currency={cur} />
        </PnlFig>
        <Op>+</Op>
        <PnlFig label="Reklam">
          <Money amount={overview.adRevenue} currency={cur} />
        </PnlFig>
        <Op>−</Op>
        <PnlFig label="Gider">
          <Money amount={overview.expenseTotal} currency={cur} />
        </PnlFig>
        <Op>=</Op>
        <PnlFig
          label="Net"
          strong
          accent={overview.net >= 0 ? "positive" : "negative"}
        >
          <Money amount={overview.net} currency={cur} />
        </PnlFig>
      </Container>

      <Tabs defaultValue="genel">
        <Tabs.List>
          <Tabs.Trigger value="genel">Genel</Tabs.Trigger>
          <Tabs.Trigger value="abonelik">Abonelik</Tabs.Trigger>
          <Tabs.Trigger value="reklam">Reklam</Tabs.Trigger>
        </Tabs.List>

        {/* GENEL: ürün kırılımı + defter */}
        <Tabs.Content value="genel" className="mt-3 flex flex-col gap-y-3">
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
                  key: "rev",
                  header: "Abonelik",
                  align: "right",
                  render: (a) => <Money amount={a.revenue28d} currency={a.currency} />,
                },
                {
                  key: "ad",
                  header: "Reklam",
                  align: "right",
                  render: (a) => <Money amount={a.adRevenue} currency={a.adCurrency} />,
                },
                {
                  key: "total",
                  header: "Toplam",
                  align: "right",
                  render: (a) => (
                    <span className="font-medium">
                      <Money amount={a.totalDisplay} currency={a.displayCurrency} />
                    </span>
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
              emptyLabel="Henüz ürün yok — Ayarlar → Entegrasyonlar'dan ekle"
            />
          </Widget>

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
        </Tabs.Content>

        {/* ABONELİK: RevenueCat dünyası */}
        <Tabs.Content value="abonelik" className="mt-3 flex flex-col gap-y-3">
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <StatCard
              label="MRR"
              sub="Aylık yinelenen"
              value={<Money amount={overview.mrr} currency={cur} />}
            />
            <StatCard label="Aktif Abonelik" sub="Şu an" value={num(overview.activeSubscriptions)} />
            <StatCard label="Trial" sub="Şu an" value={num(overview.activeTrials)} />
            <StatCard label="Yeni Müşteri" sub="Son 28 gün" value={num(overview.newCustomers)} />
          </div>

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
            <Widget title="Abonelik Geliri Trendi" className="xl:col-span-2">
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
            <Widget title="Platforma Göre">
              <BarList items={platformItems} emptyLabel="Platform verisi yok" />
            </Widget>
          </div>

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
            <Widget title="Ülkeye Göre">
              <BarList items={countryItems} emptyLabel="Ülke verisi yok" />
              {unmappedCountries.length ? (
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Haritada gösterilemeyen: {unmappedCountries.join(", ")}
                </Text>
              ) : null}
            </Widget>
          </div>
        </Tabs.Content>

        {/* REKLAM: AdMob dünyası */}
        <Tabs.Content value="reklam" className="mt-3 flex flex-col gap-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Reklam Geliri"
              sub="Son 28 gün"
              value={<Money amount={overview.adRevenue} currency={cur} />}
            />
            <StatCard
              label="eCPM"
              sub="1000 gösterim başına"
              value={<Money amount={overview.adEcpm} currency={cur} />}
            />
            <StatCard
              label="Gösterim"
              sub="Son 28 gün"
              value={num(overview.adImpressions)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <Widget title="Platforma Göre">
              <DataTable<RevenueOverview["adByPlatform"][number]>
                columns={[
                  {
                    key: "platform",
                    header: "Platform",
                    render: (p) => prettyPlatform(p.platform),
                  },
                  {
                    key: "amount",
                    header: "Gelir",
                    align: "right",
                    render: (p) => <Money amount={p.amount} currency={cur} />,
                  },
                  {
                    key: "imp",
                    header: "Gösterim",
                    align: "right",
                    render: (p) => p.impressions.toLocaleString(),
                  },
                  {
                    key: "ecpm",
                    header: "eCPM",
                    align: "right",
                    render: (p) => <Money amount={p.ecpm} currency={cur} />,
                  },
                ]}
                rows={overview.adByPlatform ?? []}
                emptyLabel="Reklam platform verisi yok"
              />
            </Widget>
            <Widget title="Ürüne Göre Reklam">
              <BarList items={adByAppItems} emptyLabel="Reklam verisi yok" />
            </Widget>
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}
