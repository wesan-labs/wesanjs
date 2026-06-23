import { Container, Select, Tabs, Text } from "@medusajs/ui"
import { ReactNode, useState } from "react"
import { Link } from "react-router-dom"
import { useAppsOverview, type AppOverviewRow } from "../../hooks/api/apps"
import {
  useAdBreakdown,
  useRevenueChart,
  useRevenueOverview,
  type AdBreakdown,
  type RevenueEventRow,
} from "../../hooks/api/revenue"
import {
  AreaChartPanel,
  BarList,
  centroidFor,
  DataTable,
  MapPanel,
  Money,
  StackedAreaChart,
  StatCard,
  Widget,
  type MapMarker,
} from "../dashboards/kit"

const usd = (v: number) => `$${Number(v).toLocaleString()}`
// RevenueCat grafik/segment verisi USD (abonelik native) — Money buradan display'e çevirir.
const RC = "USD"

const prettyPlatform = (p: string) =>
  p === "ios" ? "iOS" : p === "android" ? "Android" : p || "—"

const ICON_APPLE =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
const ICON_ANDROID =
  "M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z"

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === "ios") {
    return (
      <svg viewBox="0 0 24 24" className="fill-ui-fg-base h-4 w-4" aria-hidden>
        <path d={ICON_APPLE} />
      </svg>
    )
  }
  if (platform === "android") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ fill: "#3DDC84" }} aria-hidden>
        <path d={ICON_ANDROID} />
      </svg>
    )
  }
  return null
}

const PLATFORM_SERIES = [
  { key: "ios", label: "iOS", color: "#a1a1aa" },
  { key: "android", label: "Android", color: "#3DDC84" },
]

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
  const { breakdown } = useAdBreakdown()
  const [fApp, setFApp] = useState("all")
  const [fPlatform, setFPlatform] = useState("all")

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

  const num = (n?: number) => (n ?? 0).toLocaleString()

  // Reklam: günlük seri (platform kırılımlı) + filtrelenebilir kırılım
  const fmtDay = (s: string) =>
    new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })
  const adDaily = (breakdown?.daily ?? []).map((d) => ({
    label: fmtDay(d.date),
    ios: d.ios,
    android: d.android,
  }))
  const adApps = Array.from(
    new Map((breakdown?.rows ?? []).map((r) => [r.appId, r.appName])).entries()
  )
  const adRows = (breakdown?.rows ?? []).filter(
    (r) =>
      (fApp === "all" || r.appId === fApp) &&
      (fPlatform === "all" || r.platform === fPlatform)
  )

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
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <StatCard
              label="Bu Ay"
              sub="Takvim ayı (1→bugün)"
              value={<Money amount={overview.adRevenue} currency={cur} />}
            />
            <StatCard
              label="Geçen Ay"
              sub="Tam ay"
              value={<Money amount={overview.adRevenueLastMonth} currency={cur} />}
            />
            <StatCard
              label="eCPM"
              sub="1000 gösterim başına"
              value={<Money amount={overview.adEcpm} currency={cur} />}
            />
            <StatCard
              label="Gösterim"
              sub="Bu ay"
              value={num(overview.adImpressions)}
            />
          </div>

          <Widget title="Günlük Reklam Geliri">
            {adDaily.length ? (
              <StackedAreaChart
                data={adDaily}
                xKey="label"
                series={PLATFORM_SERIES}
                valueFormatter={(v) => v.toLocaleString()}
              />
            ) : (
              <div className="text-ui-fg-muted flex h-[240px] items-center justify-center text-sm">
                Henüz günlük veri yok
              </div>
            )}
          </Widget>

          <Widget
            title="Kırılım"
            action={
              <div className="flex items-center gap-x-2">
                <Select size="small" value={fApp} onValueChange={setFApp}>
                  <Select.Trigger className="w-44">
                    <Select.Value placeholder="Ürün" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="all">Tüm ürünler</Select.Item>
                    {adApps.map(([id, name]) => (
                      <Select.Item key={id} value={id}>
                        {name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Select size="small" value={fPlatform} onValueChange={setFPlatform}>
                  <Select.Trigger className="w-36">
                    <Select.Value placeholder="Platform" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="all">Tüm platformlar</Select.Item>
                    <Select.Item value="ios">iOS</Select.Item>
                    <Select.Item value="android">Android</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            }
          >
            <DataTable<AdBreakdown["rows"][number]>
              columns={[
                {
                  key: "app",
                  header: "Ürün",
                  render: (r) => r.appName,
                },
                {
                  key: "platform",
                  header: "Platform",
                  render: (r) => (
                    <div className="flex items-center gap-x-2">
                      <PlatformIcon platform={r.platform} />
                      {prettyPlatform(r.platform)}
                    </div>
                  ),
                },
                {
                  key: "amount",
                  header: "Gelir",
                  align: "right",
                  render: (r) => <Money amount={r.amount} currency={cur} />,
                },
                {
                  key: "imp",
                  header: "Gösterim",
                  align: "right",
                  render: (r) => r.impressions.toLocaleString(),
                },
                {
                  key: "ecpm",
                  header: "eCPM",
                  align: "right",
                  render: (r) => <Money amount={r.ecpm} currency={cur} />,
                },
              ]}
              rows={adRows}
              emptyLabel="Bu filtrede reklam verisi yok"
            />
          </Widget>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}
