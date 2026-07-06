import {
  Button,
  Container,
  FocusModal,
  Hint,
  IconButton,
  Input,
  Label,
  Select,
  Switch,
  Tabs,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { XMark } from "@medusajs/icons"
import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { useState, useContext, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  FileUpload,
  type FileType,
} from "../../components/common/file-upload"
import { LayoutComposer } from "../../components/layout-composer"
import {
  ENTRY_TILE_CLASS,
  ENTRY_TILE_STRETCH,
  type EntryTileSpan,
} from "../../components/layout-composer/entry"
import { LayoutEditContext } from "../../providers/layout-edit-provider/layout-edit-context"
import { useAppsOverview, useSync, type AppOverviewRow } from "../../hooks/api/apps"
import {
  useAdBreakdown,
  useCreateExpense,
  useRevenueChart,
  useRevenueOverview,
  useUploadExpenseInvoice,
  type AdBreakdown,
  type RevenueEventRow,
  type RevenueOverview,
} from "../../hooks/api/revenue"
import { useActiveTenant } from "../../hooks/api/tenants"
import {
  AreaChartPanel,
  BarList,
  centroidFor,
  DataTable,
  Donut,
  MapPanel,
  Money,
  StackedAreaChart,
  StatCard,
  Widget,
  type MapMarker,
} from "../dashboards/kit"
import { getLocaleAmount } from "../../lib/money-amount-helpers"

const usd = (v: number) => `$${Number(v).toLocaleString()}`

// Dar alan (donut merkezi) için kompakt tutar — getLocaleAmount ile AYNI yaklaşım
// (tarayıcı-locale [], narrowSymbol, kod yok) + compact notasyon. 100k→₺100K, 10M→₺10M.
const compactAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat([], {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)
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
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        style={{ fill: "#3DDC84" }}
        aria-hidden
      >
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

/* ---- P&L hero (tasarım): NET büyük + %marj, altta Gelir/Kesinti/MRR ---- */
const INCOME_GREEN = "#10b981"
const AD_BLUE = "#0ea5e9"

// Ay etiketi — tarayıcı/uygulama locale'i (i18n ile aynı kaynak), hardcode yok.
const monthLabel = () =>
  new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })

const HeroStat = ({
  label,
  amount,
  cur,
  negative,
}: {
  label: string
  amount: number
  cur: string
  negative?: boolean
}) => (
  <div className="flex flex-col gap-y-0.5">
    <Text size="xsmall" className="text-ui-fg-muted">
      {label}
    </Text>
    <span className="text-ui-fg-base text-lg font-semibold tabular-nums">
      {negative ? "−" : ""}
      {getLocaleAmount(amount, cur)}
    </span>
  </div>
)

const PnlSummary = ({
  overview,
  cur,
}: {
  overview: RevenueOverview
  cur: string
}) => {
  const { t } = useTranslation()
  const income = overview.subscriptionRevenue + overview.adRevenue
  const deductions =
    overview.commission + overview.expenseTotal + overview.taxTotal
  const positive = overview.net >= 0
  const margin = income > 0 ? Math.round((overview.net / income) * 100) : null
  const expenseRows = overview.expensesThisMonth ?? []

  return (
    <Container className="flex h-full flex-col overflow-hidden p-0">
      <div className="flex flex-1 flex-col justify-center gap-y-2 p-6">
        <Text
          size="xsmall"
          weight="plus"
          className="text-ui-fg-muted uppercase tracking-wider"
        >
          {t("revenue.pnl.netProfit")} · {monthLabel()}
        </Text>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className="text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl"
            style={{ color: positive ? "#059669" : "#dc2626" }}
          >
            {getLocaleAmount(overview.net, cur)}
          </span>
          {margin != null ? (
            <span className="bg-ui-bg-component text-ui-fg-subtle rounded-full px-2 py-0.5 text-xs tabular-nums">
              {t("revenue.pnl.margin", { value: margin })}
            </span>
          ) : null}
        </div>
      </div>
      <div className="border-ui-border-base flex flex-wrap gap-x-10 gap-y-3 border-t p-6">
        <HeroStat label={t("revenue.pnl.income")} amount={income} cur={cur} />
        <HeroStat
          label={t("revenue.pnl.deduction")}
          amount={deductions}
          cur={cur}
          negative
        />
        <HeroStat
          label={t("revenue.pnl.mrr")}
          amount={overview.mrr}
          cur={cur}
        />
      </div>
      {deductions > 0 ? (
        <div className="border-ui-border-base border-t px-6 py-4">
          <Text
            size="xsmall"
            weight="plus"
            className="text-ui-fg-muted mb-2 uppercase tracking-wider"
          >
            {t("revenue.pnl.deductionDetail", {
              defaultValue: "Deduction breakdown (this month)",
            })}
          </Text>
          <div className="flex flex-col gap-y-1">
            {overview.commission > 0 ? (
              <div className="flex justify-between gap-x-4 text-sm">
                <span className="text-ui-fg-subtle">
                  {t("revenue.pnl.commission", { defaultValue: "Store commission" })}
                </span>
                <span className="text-ui-fg-base tabular-nums">
                  −{getLocaleAmount(overview.commission, cur)}
                </span>
              </div>
            ) : null}
            {expenseRows.map((e) => (
              <div
                key={e.id}
                className="flex justify-between gap-x-4 text-sm"
              >
                <span className="text-ui-fg-subtle truncate">
                  {e.description}
                  <span className="text-ui-fg-muted"> · {e.category}</span>
                </span>
                <span className="text-ui-fg-base shrink-0 tabular-nums">
                  −{getLocaleAmount(e.amount, cur)}
                </span>
              </div>
            ))}
            {overview.taxTotal > 0 ? (
              <div className="flex justify-between gap-x-4 text-sm">
                <span className="text-ui-fg-subtle">
                  {t("revenue.pnl.tax", { defaultValue: "Tax" })}
                </span>
                <span className="text-ui-fg-base tabular-nums">
                  −{getLocaleAmount(overview.taxTotal, cur)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Container>
  )
}

/* ---- Gelir kompozisyonu: donut (abonelik vs reklam) + değerli legend ---- */
const RevenueComposition = ({
  overview,
  cur,
}: {
  overview: RevenueOverview
  cur: string
}) => {
  const { t } = useTranslation()
  const income = overview.subscriptionRevenue + overview.adRevenue
  const pct = (v: number) => (income > 0 ? Math.round((v / income) * 100) : 0)
  const legend = [
    {
      id: "sub",
      label: t("revenue.composition.subscription"),
      value: overview.subscriptionRevenue,
      color: INCOME_GREEN,
    },
    {
      id: "ad",
      label: t("revenue.composition.ad"),
      value: overview.adRevenue,
      color: AD_BLUE,
    },
  ]

  return (
    <Widget title={t("revenue.composition.title")} className="h-full">
      <div className="flex h-full min-h-0 flex-1 items-center gap-x-6">
        <Donut
          segments={legend}
          center={
            <>
              <span className="text-ui-fg-muted text-[10px] uppercase tracking-wider">
                {t("revenue.composition.income")}
              </span>
              <span className="text-ui-fg-base text-sm font-semibold tabular-nums">
                {compactAmount(income, cur)}
              </span>
            </>
          }
        />
        <div className="flex flex-1 flex-col gap-y-4">
          {legend.map((s) => (
            <div key={s.id} className="flex flex-col gap-y-0.5">
              <div className="text-ui-fg-muted flex items-center gap-x-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.label}
              </div>
              <div className="text-ui-fg-base text-sm font-semibold tabular-nums">
                {getLocaleAmount(s.value, cur)} · %{pct(s.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  )
}

/** View-mode grid cell; edit mode delegates tile span to SortableEntry. */
const TileGate = ({
  tile,
  children,
}: {
  tile: EntryTileSpan
  children: ReactNode
}) => {
  const { editMode } = useContext(LayoutEditContext)
  if (editMode) {
    return <>{children}</>
  }
  return (
    <div className={clx(ENTRY_TILE_CLASS[tile], ENTRY_TILE_STRETCH, "min-w-0")}>
      {children}
    </div>
  )
}

/**
 * Tab filter + grid cell in one wrapper. Returns null (no grid slot) when the
 * tab is inactive in view mode — prevents empty rows between toolbar and KPIs.
 */
const TabGate = ({
  tab,
  activeTab,
  tile,
  children,
}: {
  tab: string
  activeTab: string
  tile: EntryTileSpan
  children: ReactNode
}) => {
  const { editMode } = useContext(LayoutEditContext)
  if (!editMode && activeTab !== tab) {
    return null
  }
  if (editMode) {
    return <>{children}</>
  }
  return (
    <div className={clx(ENTRY_TILE_CLASS[tile], ENTRY_TILE_STRETCH, "min-w-0")}>
      {children}
    </div>
  )
}

const fmtSyncTime = (iso?: string | null) => {
  if (!iso) {
    return null
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const RevenueSyncBar = ({
  overview,
  panelUpdatedAt,
  onSync,
  syncing,
}: {
  overview: RevenueOverview
  panelUpdatedAt?: number
  onSync: () => void
  syncing: boolean
}) => {
  const { t } = useTranslation()
  const sync = overview.sync
  const panelLabel = panelUpdatedAt
    ? fmtSyncTime(new Date(panelUpdatedAt).toISOString())
    : null
  const rcLabel = fmtSyncTime(sync?.revenuecatLastSyncedAt)
  const admobLabel = fmtSyncTime(sync?.admobLastSyncedAt)
  const dataThrough =
    sync?.subscriptionDataThrough || sync?.adDataThrough || null

  return (
    <Container className="flex flex-col gap-y-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Text size="xsmall" className="text-ui-fg-muted">
          {t("revenue.sync.panelRefreshed")}:{" "}
          <span className="text-ui-fg-subtle tabular-nums">
            {panelLabel ?? t("revenue.sync.never")}
          </span>
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted hidden sm:inline">
          ·
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {t("revenue.sync.revenuecatSynced")}:{" "}
          <span className="text-ui-fg-subtle tabular-nums">
            {rcLabel ?? t("revenue.sync.never")}
          </span>
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted hidden sm:inline">
          ·
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {t("revenue.sync.admobSynced")}:{" "}
          <span className="text-ui-fg-subtle tabular-nums">
            {admobLabel ?? t("revenue.sync.never")}
          </span>
        </Text>
        {dataThrough ? (
          <>
            <Text size="xsmall" className="text-ui-fg-muted hidden sm:inline">
              ·
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {t("revenue.sync.dataThrough")}:{" "}
              <span className="text-ui-fg-subtle tabular-nums">
                {dataThrough}
              </span>
            </Text>
          </>
        ) : null}
      </div>
      <Button
        size="small"
        variant="secondary"
        isLoading={syncing}
        onClick={onSync}
        className="shrink-0"
      >
        {t("revenue.sync.syncNow")}
      </Button>
    </Container>
  )
}

export const Component = () => {
  const { t } = useTranslation()
  const { activeTenant, tenants } = useActiveTenant()
  const { overview, isLoading, isError, error, dataUpdatedAt } =
    useRevenueOverview()
  const syncMutation = useSync()
  const revenueChart = useRevenueChart("revenue")
  const platformChart = useRevenueChart("revenue", "store")
  const countryChart = useRevenueChart("revenue", "country")
  const { apps } = useAppsOverview()
  const { breakdown } = useAdBreakdown()
  const [fApp, setFApp] = useState("all")
  const [fPlatform, setFPlatform] = useState("all")
  const [activeTab, setActiveTab] = useState("genel")
  const [period, setPeriod] = useState("28g")
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expense, setExpense] = useState({
    description: "",
    amount: "",
    category: "",
    occurred_at: new Date().toISOString().slice(0, 10),
    recurring: false,
    vendor: "",
    invoice_number: "",
  })
  const [expenseInvoiceFile, setExpenseInvoiceFile] = useState<File | null>(null)
  const [expenseInvoiceError, setExpenseInvoiceError] = useState<string>()
  const createExpense = useCreateExpense()
  const uploadExpenseInvoice = useUploadExpenseInvoice()

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-muted">
          {t("revenue.loading")}
        </Text>
      </Container>
    )
  }

  if (isError || !overview) {
    const status = (error as { status?: number })?.status
    const onOrgWithoutAccess =
      status === 403 &&
      tenants.length > 1 &&
      activeTenant &&
      !activeTenant.rbac_role_id

    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-error">
          {onOrgWithoutAccess
            ? t("revenue.loadErrorWrongOrg", {
                org: activeTenant.name,
                defaultValue:
                  "Revenue data is not available in {{org}}. Switch to an organization where you have a finance role.",
              })
            : t("revenue.loadError")}
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
      mapMarkers.push({
        lng: c[0],
        lat: c[1],
        label: name,
        value,
        display: usd(value),
      })
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

  // Genel: gerçek seriler (uydurma yok — yoksa sparkline çizilmez)
  const income = overview.subscriptionRevenue + overview.adRevenue
  const mrrTrend = (overview.mrrTrend ?? []).map((m) => m.mrr)
  const adDailyTotals = (breakdown?.daily ?? []).map((d) => d.total)
  // "Bugün" kartı için gerçek delta: bugün vs dün (aylık trend değil).
  const adNowDelta = (() => {
    const n = adDailyTotals.length
    if (n < 2) {
      return null
    }
    const today = adDailyTotals[n - 1]
    const prev = adDailyTotals[n - 2]
    return prev > 0 ? ((today - prev) / prev) * 100 : null
  })()
  // Abonelik günlük geliri (revenuePoints = "revenue" metric = abonelik).
  const subTrend = revenuePoints.map((p) => p.value)
  // Toplam günlük gelir = abonelik (revenuePoints) + reklam (breakdown.daily),
  // gün bazında birleştir. Her ikisi de ISO YYYY-MM-DD. İki gerçek seriyi
  // toplamak — uydurma değil. O(n+m) time, O(g) space (g = benzersiz gün).
  const totalByDay = new Map<string, number>()
  revenuePoints.forEach((p) => {
    const k = String(p.date).slice(0, 10)
    totalByDay.set(k, (totalByDay.get(k) ?? 0) + p.value)
  })
  ;(breakdown?.daily ?? []).forEach((d) => {
    const k = String(d.date).slice(0, 10)
    totalByDay.set(k, (totalByDay.get(k) ?? 0) + d.total)
  })
  const totalDailyPoints = Array.from(totalByDay.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, value]) => ({ date, value }))
  const totalTrend = totalDailyPoints.map((p) => p.value)
  // Dönem seçimi trend görünümünü kırpar (gerçek, client-side — günlük seri elde).
  const periodDays =
    period === "7g" ? 7 : period === "28g" ? 28 : totalDailyPoints.length
  const visibleTrend = totalDailyPoints.slice(-periodDays)
  const periodLabel =
    period === "7g"
      ? t("revenue.period.last7")
      : period === "28g"
      ? t("revenue.period.last28")
      : t("revenue.period.month")

  // Reklam: günlük seri (platform kırılımlı) + filtrelenebilir kırılım
  const fmtDay = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    })
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
    <>
      <LayoutComposer
        widgetsZonePrefix="revenue.overview"
        preferredLayoutId={CORE_LAYOUT_IDS.DASHBOARD_GRID}
        controlSize="small"
        sections={{
          main: (
            <>
              <LayoutComposer.Entry
                id="RevenueSyncMeta"
                label={t("revenue.layout.syncBar")}
                tile="full"
              >
                <TileGate tile="full">
                <RevenueSyncBar
                  overview={overview}
                  panelUpdatedAt={dataUpdatedAt}
                  syncing={syncMutation.isPending}
                  onSync={() =>
                    syncMutation.mutate(undefined, {
                      onSuccess: (r) => {
                        toast.success(
                          `RC ${r.revenuecat.synced} · AdMob ${r.admob.synced}`
                        )
                      },
                      onError: () => toast.error(t("revenue.loadError")),
                    })
                  }
                />
                </TileGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueToolbar"
                label={t("revenue.layout.toolbar")}
                tile="full"
              >
                <TileGate tile="full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <Tabs.List>
                      <Tabs.Trigger value="genel">
                        {t("revenue.tabs.general")}
                      </Tabs.Trigger>
                      <Tabs.Trigger value="abonelik">
                        {t("revenue.tabs.subscription")}
                      </Tabs.Trigger>
                      <Tabs.Trigger value="reklam">
                        {t("revenue.tabs.ads")}
                      </Tabs.Trigger>
                    </Tabs.List>
                  </Tabs>
                  <div className="flex items-center gap-x-2">
                    <Tabs value={period} onValueChange={setPeriod}>
                      <Tabs.List>
                        <Tabs.Trigger value="7g">
                          {t("revenue.period.d7")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="28g">
                          {t("revenue.period.d28")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="month">
                          {t("revenue.period.month")}
                        </Tabs.Trigger>
                      </Tabs.List>
                    </Tabs>
                    <Button size="small" onClick={() => setExpenseOpen(true)}>
                      {t("revenue.addExpense")}
                    </Button>
                  </div>
                </div>
                </TileGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenuePnlSummary"
                label={t("revenue.layout.pnlSummary")}
                tile="hero-left"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="hero-left">
                  <PnlSummary overview={overview} cur={cur} />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueComposition"
                label={t("revenue.layout.composition")}
                tile="hero-right"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="hero-right">
                  <RevenueComposition overview={overview} cur={cur} />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueKpiTotalRevenue"
                label={t("revenue.kpi.totalRevenue")}
                tile="kpi"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.kpi.totalRevenue")}
                    sub={t("revenue.kpi.totalRevenueSub")}
                    accent="positive"
                    value={<Money amount={income} currency={cur} />}
                    trend={totalTrend}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueKpiMrr"
                label={t("revenue.kpi.mrr")}
                tile="kpi"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.kpi.mrr")}
                    sub={t("revenue.kpi.mrrSub")}
                    accent="positive"
                    value={<Money amount={overview.mrr} currency={cur} />}
                    trend={mrrTrend}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueKpiActiveSubs"
                label={t("revenue.kpi.activeSubs")}
                tile="kpi"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.kpi.activeSubs")}
                    sub={t("revenue.kpi.now")}
                    value={num(overview.activeSubscriptions)}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueKpiAdThisMonth"
                label={t("revenue.kpi.adThisMonth")}
                tile="kpi"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.kpi.adThisMonth")}
                    sub={t("revenue.kpi.calendarMonth")}
                    accent="positive"
                    value={<Money amount={overview.adRevenue} currency={cur} />}
                    trend={adDailyTotals}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueTotalTrend"
                label={t("revenue.layout.totalTrend")}
                tile="full"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="full">
                  <Widget title={`${t("revenue.trend.totalTitle")} · ${periodLabel}`}>
                    {visibleTrend.length ? (
                      <AreaChartPanel
                        data={visibleTrend}
                        xKey="date"
                        yKey="value"
                        valueFormatter={usd}
                      />
                    ) : (
                      <div className="text-ui-fg-muted flex h-[240px] items-center justify-center text-sm">
                        {t("revenue.noData")}
                      </div>
                    )}
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueGeoMap"
                label={t("revenue.layout.geoMap")}
                tile="wide"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="wide">
                  <Widget title={t("revenue.regions.title")} className="h-full">
                    <div className="flex min-h-[320px] flex-1 flex-col">
                      {mapMarkers.length ? (
                        <MapPanel markers={mapMarkers} />
                      ) : (
                        <div className="text-ui-fg-muted flex flex-1 items-center justify-center text-sm">
                          {t("revenue.regions.empty")}
                        </div>
                      )}
                    </div>
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueGeoCountry"
                label={t("revenue.layout.geoCountry")}
                tile="narrow"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="narrow">
                  <Widget title={t("revenue.regions.byCountry")} className="h-full">
                    <div className="flex min-h-[320px] flex-1 flex-col">
                      <BarList
                        items={countryItems}
                        emptyLabel={t("revenue.regions.countryEmpty")}
                      />
                      {unmappedCountries.length ? (
                        <Text size="xsmall" className="text-ui-fg-muted mt-2">
                          {t("revenue.regions.unmapped", {
                            list: unmappedCountries.join(", "),
                          })}
                        </Text>
                      ) : null}
                    </div>
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAppsTable"
                label={t("revenue.layout.appsTable")}
                tile="full"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="full">
                  <Widget title={t("revenue.apps.title")}>
                    <DataTable<AppOverviewRow>
                      columns={[
                        {
                          key: "name",
                          header: t("revenue.apps.app"),
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
                          header: t("revenue.apps.subscription"),
                          align: "right",
                          render: (a) => (
                            <Money amount={a.revenue28d} currency={a.currency} />
                          ),
                        },
                        {
                          key: "ad",
                          header: t("revenue.apps.ad"),
                          align: "right",
                          render: (a) => (
                            <Money amount={a.adRevenue} currency={a.adCurrency} />
                          ),
                        },
                        {
                          key: "total",
                          header: t("revenue.apps.total"),
                          align: "right",
                          render: (a) => (
                            <span className="font-medium">
                              <Money
                                amount={a.totalDisplay}
                                currency={a.displayCurrency}
                              />
                            </span>
                          ),
                        },
                        {
                          key: "subs",
                          header: t("revenue.apps.subscribers"),
                          align: "right",
                          render: (a) => a.activeSubscriptions.toLocaleString(),
                        },
                      ]}
                      rows={apps}
                      emptyLabel={t("revenue.apps.empty")}
                    />
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueRecentTx"
                label={t("revenue.layout.recentTx")}
                tile="full"
              >
                <TabGate tab="genel" activeTab={activeTab} tile="full">
          <Widget title={t("revenue.recent.title")}>
            <DataTable<RevenueEventRow>
              columns={[
                {
                  key: "kind",
                  header: t("revenue.recent.kind"),
                  render: (r) => r.kind,
                },
                {
                  key: "date",
                  header: t("revenue.recent.date"),
                  render: (r) => new Date(r.occurred_at).toLocaleDateString(),
                },
                {
                  key: "amount",
                  header: t("revenue.recent.amount"),
                  align: "right",
                  render: (r) => (
                    <Money amount={r.gross_amount} currency={r.currency} />
                  ),
                },
              ]}
              rows={overview.recentEvents}
              emptyLabel={t("revenue.recent.empty")}
            />
          </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiThisMonth"
                label={t("revenue.sub.thisMonth")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.thisMonth")}
                    sub={t("revenue.sub.thisMonthSub")}
                    accent="positive"
                    value={
                      <Money amount={overview.subscriptionRevenue} currency={cur} />
                    }
                    trend={subTrend}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiLastMonth"
                label={t("revenue.sub.lastMonth")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.lastMonth")}
                    sub={t("revenue.sub.lastMonthSub")}
                    value={
                      <Money
                        amount={overview.subscriptionRevenueLastMonth}
                        currency={cur}
                      />
                    }
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiMrr"
                label={t("revenue.sub.mrr")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.mrr")}
                    sub={t("revenue.sub.mrrSub")}
                    accent="positive"
                    value={<Money amount={overview.mrr} currency={cur} />}
                    trend={mrrTrend}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiActiveSubs"
                label={t("revenue.sub.activeSubs")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.activeSubs")}
                    sub={t("revenue.sub.now")}
                    value={num(overview.activeSubscriptions)}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiTrial"
                label={t("revenue.sub.trial")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.trial")}
                    sub={t("revenue.sub.now")}
                    value={num(overview.activeTrials)}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiNewCustomers"
                label={t("revenue.sub.newCustomers")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.newCustomers")}
                    sub={t("revenue.sub.last28d")}
                    value={num(overview.newCustomers)}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubKpiActiveUsers"
                label={t("revenue.sub.activeUsers")}
                tile="kpi"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.sub.activeUsers")}
                    sub={t("revenue.sub.last28d")}
                    value={num(overview.activeUsers)}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubProducts"
                label={t("revenue.layout.subProducts")}
                tile="full"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="full">
          <Widget title={t("revenue.sub.byProduct")}>
            <DataTable<AppOverviewRow>
              columns={[
                {
                  key: "name",
                  header: t("revenue.apps.product"),
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
                  header: t("revenue.sub.thisMonth"),
                  align: "right",
                  render: (a) => (
                    <Money amount={a.revenue28d} currency={a.currency} />
                  ),
                },
                {
                  key: "mrr",
                  header: t("revenue.sub.mrr"),
                  align: "right",
                  render: (a) => <Money amount={a.mrr} currency={a.currency} />,
                },
                {
                  key: "subs",
                  header: t("revenue.sub.activeSubs"),
                  align: "right",
                  render: (a) => a.activeSubscriptions.toLocaleString(),
                },
              ]}
              rows={apps}
              emptyLabel={t("revenue.sub.productEmpty")}
            />
          </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubTrendChart"
                label={t("revenue.layout.subTrend")}
                tile="wide"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="wide">
                  <Widget title={t("revenue.sub.trendTitle")} className="h-full">
                    <div className="flex min-h-[240px] flex-1 flex-col">
                      {revenuePoints.length ? (
                        <AreaChartPanel
                          data={revenuePoints}
                          xKey="date"
                          yKey="value"
                          valueFormatter={usd}
                        />
                      ) : (
                        <div className="text-ui-fg-muted flex flex-1 items-center justify-center text-sm">
                          {t("revenue.noData")}
                        </div>
                      )}
                    </div>
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubTrendPlatform"
                label={t("revenue.layout.subPlatform")}
                tile="narrow"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="narrow">
                  <Widget title={t("revenue.sub.byPlatform")} className="h-full">
                    <div className="flex min-h-[240px] flex-1 flex-col">
                      <BarList
                        items={platformItems}
                        emptyLabel={t("revenue.sub.platformEmpty")}
                      />
                    </div>
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubGeoMap"
                label={t("revenue.layout.geoMap")}
                tile="wide"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="wide">
                  <Widget title={t("revenue.regions.title")} className="h-full">
                    <div className="flex min-h-[320px] flex-1 flex-col">
                      {mapMarkers.length ? (
                        <MapPanel markers={mapMarkers} />
                      ) : (
                        <div className="text-ui-fg-muted flex flex-1 items-center justify-center text-sm">
                          {t("revenue.regions.empty")}
                        </div>
                      )}
                    </div>
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueSubGeoCountry"
                label={t("revenue.layout.geoCountry")}
                tile="narrow"
              >
                <TabGate tab="abonelik" activeTab={activeTab} tile="narrow">
                  <Widget title={t("revenue.regions.byCountry")} className="h-full">
                    <div className="flex min-h-[320px] flex-1 flex-col">
                      <BarList
                        items={countryItems}
                        emptyLabel={t("revenue.regions.countryEmpty")}
                      />
                      {unmappedCountries.length ? (
                        <Text size="xsmall" className="text-ui-fg-muted mt-2">
                          {t("revenue.regions.unmapped", {
                            list: unmappedCountries.join(", "),
                          })}
                        </Text>
                      ) : null}
                    </div>
                  </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              {overview.adRevenue === 0 && !breakdown?.daily?.length ? (
                <LayoutComposer.Entry
                  id="RevenueAdNotice"
                  label={t("revenue.layout.adNotice")}
                  tile="full"
                >
                  <TabGate tab="reklam" activeTab={activeTab} tile="full">
            <Container className="p-4">
              <Text size="small" className="text-ui-fg-subtle">
                {t("revenue.ad.noLocalData", {
                  defaultValue:
                    "No AdMob data in this organization yet. Connect AdMob under Settings → Integrations and run a sync, or ask an admin to seed pilot metrics.",
                })}
              </Text>
            </Container>
                  </TabGate>
                </LayoutComposer.Entry>
              ) : null}

              <LayoutComposer.Entry
                id="RevenueAdKpiToday"
                label={t("revenue.ad.today")}
                tile="kpi"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.ad.today")}
                    sub={t("revenue.ad.todaySub")}
                    accent="positive"
                    value={<Money amount={overview.adRevenueNow} currency={cur} />}
                    trend={adDailyTotals}
                    delta={adNowDelta}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAdKpiThisMonth"
                label={t("revenue.ad.thisMonth")}
                tile="kpi"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.ad.thisMonth")}
                    sub={t("revenue.ad.thisMonthSub")}
                    accent="positive"
                    value={<Money amount={overview.adRevenue} currency={cur} />}
                    trend={adDailyTotals}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAdKpiLastMonth"
                label={t("revenue.ad.lastMonth")}
                tile="kpi"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.ad.lastMonth")}
                    sub={t("revenue.ad.lastMonthSub")}
                    value={
                      <Money amount={overview.adRevenueLastMonth} currency={cur} />
                    }
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAdKpiEcpm"
                label={t("revenue.ad.ecpm")}
                tile="kpi"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.ad.ecpm")}
                    sub={t("revenue.ad.ecpmSub")}
                    value={<Money amount={overview.adEcpm} currency={cur} />}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAdKpiImpressions"
                label={t("revenue.ad.impressions")}
                tile="kpi"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="kpi">
                  <StatCard
                    label={t("revenue.ad.impressions")}
                    sub={t("revenue.ad.impressionsSub")}
                    value={num(overview.adImpressions)}
                  />
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAdDaily"
                label={t("revenue.layout.adDaily")}
                tile="full"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="full">
          <Widget title={t("revenue.ad.dailyTitle")}>
            {adDaily.length ? (
              <StackedAreaChart
                data={adDaily}
                xKey="label"
                series={PLATFORM_SERIES}
                valueFormatter={(v) => v.toLocaleString()}
              />
            ) : (
              <div className="text-ui-fg-muted flex h-[240px] items-center justify-center text-sm">
                {t("revenue.ad.dailyEmpty")}
              </div>
            )}
          </Widget>
                </TabGate>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry
                id="RevenueAdBreakdown"
                label={t("revenue.layout.adBreakdown")}
                tile="full"
              >
                <TabGate tab="reklam" activeTab={activeTab} tile="full">
          <Widget
            title={t("revenue.ad.breakdown")}
            action={
              <div className="flex items-center gap-x-2">
                <Select size="small" value={fApp} onValueChange={setFApp}>
                  <Select.Trigger className="w-44">
                    <Select.Value placeholder={t("revenue.ad.product")} />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="all">
                      {t("revenue.ad.allProducts")}
                    </Select.Item>
                    {adApps.map(([id, name]) => (
                      <Select.Item key={id} value={id}>
                        {name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Select
                  size="small"
                  value={fPlatform}
                  onValueChange={setFPlatform}
                >
                  <Select.Trigger className="w-36">
                    <Select.Value placeholder={t("revenue.ad.platform")} />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="all">
                      {t("revenue.ad.allPlatforms")}
                    </Select.Item>
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
                  header: t("revenue.ad.product"),
                  render: (r) => r.appName,
                },
                {
                  key: "platform",
                  header: t("revenue.ad.platform"),
                  render: (r) => (
                    <div className="flex items-center gap-x-2">
                      <PlatformIcon platform={r.platform} />
                      {prettyPlatform(r.platform)}
                    </div>
                  ),
                },
                {
                  key: "amount",
                  header: t("revenue.ad.revenue"),
                  align: "right",
                  render: (r) => <Money amount={r.amount} currency={cur} />,
                },
                {
                  key: "imp",
                  header: t("revenue.ad.impressions"),
                  align: "right",
                  render: (r) => r.impressions.toLocaleString(),
                },
                {
                  key: "ecpm",
                  header: t("revenue.ad.ecpm"),
                  align: "right",
                  render: (r) => <Money amount={r.ecpm} currency={cur} />,
                },
              ]}
              rows={adRows}
              emptyLabel={t("revenue.ad.emptyFilter")}
            />
          </Widget>
                </TabGate>
              </LayoutComposer.Entry>
            </>
          ),
        }}
      />

      <FocusModal open={expenseOpen} onOpenChange={setExpenseOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  {t("revenue.expense.cancel")}
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                isLoading={
                  createExpense.isPending || uploadExpenseInvoice.isPending
                }
                disabled={!expense.description.trim() || !expense.amount}
                onClick={async () => {
                  try {
                    let invoice_url: string | null = null
                    if (expenseInvoiceFile) {
                      const uploaded = await uploadExpenseInvoice.mutateAsync(
                        expenseInvoiceFile
                      )
                      invoice_url = uploaded.url
                    }
                    createExpense.mutate(
                      {
                        description: expense.description.trim(),
                        amount: Number(expense.amount),
                        currency: cur,
                        category:
                          (expense.category.trim() as
                            | "infra"
                            | "api"
                            | "ads"
                            | "other") || "other",
                        occurred_at: expense.occurred_at,
                        recurring: expense.recurring,
                        vendor: expense.vendor.trim() || null,
                        invoice_number: expense.invoice_number.trim() || null,
                        invoice_url,
                      },
                      {
                        onSuccess: () => {
                          toast.success(t("revenue.expense.created"))
                          setExpenseOpen(false)
                          setExpenseInvoiceFile(null)
                          setExpenseInvoiceError(undefined)
                          setExpense({
                            description: "",
                            amount: "",
                            category: "",
                            occurred_at: new Date().toISOString().slice(0, 10),
                            recurring: false,
                            vendor: "",
                            invoice_number: "",
                          })
                        },
                        onError: (e: Error) =>
                          toast.error(
                            e?.message || t("revenue.expense.createError")
                          ),
                      }
                    )
                  } catch (e) {
                    toast.error(
                      (e as Error)?.message || t("revenue.expense.uploadError")
                    )
                  }
                }}
              >
                {t("revenue.expense.save")}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col items-center overflow-auto py-8">
            <div className="flex w-full max-w-lg flex-col gap-y-4">
              <div>
                <Text size="large" weight="plus">
                  {t("revenue.expense.title")}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("revenue.expense.hint")}
                </Text>
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("revenue.expense.description")}</Label>
                <Input
                  value={expense.description}
                  onChange={(e) =>
                    setExpense({ ...expense, description: e.target.value })
                  }
                  placeholder={t("revenue.expense.descriptionPh")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-y-2">
                  <Label>
                    {t("revenue.expense.amount", { currency: cur })}
                  </Label>
                  <Input
                    type="number"
                    value={expense.amount}
                    onChange={(e) =>
                      setExpense({ ...expense, amount: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>{t("revenue.expense.date")}</Label>
                  <Input
                    type="date"
                    value={expense.occurred_at}
                    onChange={(e) =>
                      setExpense({ ...expense, occurred_at: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-y-2">
                  <Label>{t("revenue.expense.vendor")}</Label>
                  <Input
                    value={expense.vendor}
                    onChange={(e) =>
                      setExpense({ ...expense, vendor: e.target.value })
                    }
                    placeholder={t("revenue.expense.vendorPh")}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>{t("revenue.expense.invoiceNumber")}</Label>
                  <Input
                    value={expense.invoice_number}
                    onChange={(e) =>
                      setExpense({
                        ...expense,
                        invoice_number: e.target.value,
                      })
                    }
                    placeholder={t("revenue.expense.invoiceNumberPh")}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("revenue.expense.invoiceFile")}</Label>
                {expenseInvoiceFile ? (
                  <div className="bg-ui-bg-component border-ui-border-base flex items-center justify-between gap-x-3 rounded-lg border px-3 py-2">
                    <Text size="small" className="truncate">
                      {expenseInvoiceFile.name}
                    </Text>
                    <IconButton
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() => setExpenseInvoiceFile(null)}
                    >
                      <XMark className="text-ui-fg-muted" />
                    </IconButton>
                  </div>
                ) : (
                  <FileUpload
                    label={t("revenue.expense.invoiceFile")}
                    hint={t("revenue.expense.invoiceFileHint")}
                    multiple={false}
                    formats={[
                      "application/pdf",
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                      ".pdf,.jpg,.jpeg,.png,.webp",
                    ]}
                    maxFileSize={10 * 1024 * 1024}
                    hasError={!!expenseInvoiceError}
                    onUploaded={(files: FileType[], rejected) => {
                      setExpenseInvoiceError(undefined)
                      if (rejected?.length) {
                        setExpenseInvoiceError(t("revenue.expense.uploadError"))
                        return
                      }
                      const file = files[0]?.file
                      if (file) {
                        setExpenseInvoiceFile(file)
                      }
                    }}
                  />
                )}
                {expenseInvoiceError ? (
                  <Hint variant="error">{expenseInvoiceError}</Hint>
                ) : null}
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("revenue.expense.category")}</Label>
                <Input
                  value={expense.category}
                  onChange={(e) =>
                    setExpense({ ...expense, category: e.target.value })
                  }
                  placeholder={t("revenue.expense.categoryPh")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label>{t("revenue.expense.recurring")}</Label>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {t("revenue.expense.recurringHint")}
                  </Text>
                </div>
                <Switch
                  checked={expense.recurring}
                  onCheckedChange={(c) =>
                    setExpense({ ...expense, recurring: !!c })
                  }
                />
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}
