import {
  ArrowUpRightOnBox,
  ChartBar,
  ChatBubbleLeftRight,
  ExclamationCircle,
  Plus,
} from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { PlatformGlyph } from "../content/components/prompt-meta"
import {
  PostAnalytics,
  SocialAccount,
  useConnectSocial,
  useSocialAccounts,
  useSocialAnalytics,
} from "../../hooks/api/social"

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "threads", label: "Threads" },
]
const labelOf = (id: string) => PLATFORMS.find((p) => p.id === id)?.label ?? id

const PLATFORM_COLOR: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#22D3EE",
  linkedin: "#0A66C2",
  x: "#A1A1AA",
  youtube: "#FF4D4D",
  facebook: "#1877F2",
  threads: "#A1A1AA",
}
const colorOf = (p: string) => PLATFORM_COLOR[p] ?? "#8B5CF6"

const ENGAGEMENT_BENCHMARK: Record<string, number> = {
  tiktok: 4.25,
  instagram: 0.85,
  youtube: 1.6,
  facebook: 0.6,
  linkedin: 2,
  x: 0.45,
  threads: 1,
}
const benchmarkOf = (p: string) => ENGAGEMENT_BENCHMARK[p] ?? 1

const GREEN = "#10B981"
const RED = "#EF4444"
const PRIMARY = "#8B5CF6"
const ORANGE = "#F59E0B"
const PALETTE = ["#8B5CF6", "#F59E0B", "#3B82F6", "#10B981", "#EC4899", "#14B8A6"]

const fmtNum = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(2).replace(/\.?0+$/, "") + "K"
  return String(Math.round(n))
}
const snippet = (s: string, n = 26) =>
  s ? (s.length > n ? s.slice(0, n) + "…" : s) : "(başlıksız)"

type TabId = "overview" | "engagement" | "profile" | "post"
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Genel" },
  { id: "engagement", label: "Etkileşim" },
  { id: "profile", label: "Profil" },
  { id: "post", label: "Gönderiler" },
]

// ── KPI card ──────────────────────────────────────────────
const KpiCard = ({
  label,
  value,
  sub,
  trend,
  loading,
}: {
  label: string
  value: string
  sub?: string
  trend?: { up: boolean; text: string }
  loading?: boolean
}) => (
  <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-2 rounded-xl border p-4">
    <Text size="xsmall" className="text-ui-fg-muted">
      {label}
    </Text>
    <Text size="xlarge" weight="plus" className="tabular-nums leading-none">
      {loading ? "···" : value}
    </Text>
    {trend ? (
      <span
        className="flex w-fit items-center gap-x-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
        style={{
          color: trend.up ? GREEN : RED,
          backgroundColor: (trend.up ? GREEN : RED) + "1a",
        }}
      >
        {trend.up ? "▲" : "▼"} {trend.text}
      </span>
    ) : sub ? (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {sub}
      </Text>
    ) : null}
  </div>
)

// ── Highlight card with gradient progress (Daily Activity analog) ──
const HighlightCard = ({
  label,
  subtitle,
  value,
  fillPct,
  footer,
  loading,
}: {
  label: string
  subtitle: string
  value: string
  fillPct: number
  footer?: React.ReactNode
  loading?: boolean
}) => (
  <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-3 rounded-xl border p-4">
    <div className="flex flex-col gap-y-0.5">
      <Text weight="plus">{label}</Text>
      <Text size="xsmall" className="text-ui-fg-muted">
        {subtitle}
      </Text>
    </div>
    <Text size="xlarge" weight="plus" className="tabular-nums leading-none">
      {loading ? "···" : value}
    </Text>
    <div className="bg-ui-bg-subtle relative h-2.5 w-full overflow-hidden rounded-full">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.max(2, Math.min(100, fillPct))}%`,
          background: `linear-gradient(90deg, ${PRIMARY}, ${ORANGE})`,
        }}
      />
    </div>
    {footer}
  </div>
)

// ── Themed chart tooltip ──────────────────────────────────
const PostTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PostAnalytics }>
}) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const rows: [string, number, string][] = [
    ["Görüntüleme", p.views, PRIMARY],
    ["Beğeni", p.likes, ORANGE],
    ["Paylaşım", p.shares, "#3B82F6"],
    ["Kaydetme", p.saves, GREEN],
  ]
  return (
    <div className="bg-ui-bg-base border-ui-border-base shadow-elevation-tooltip max-w-[240px] rounded-lg border px-3 py-2">
      <Text size="xsmall" className="text-ui-fg-subtle line-clamp-2">
        {p.content || "(başlıksız)"}
      </Text>
      <div className="mt-1.5 flex flex-col gap-y-0.5 text-xs tabular-nums">
        {rows.map(([k, v, c]) => (
          <div key={k} className="flex items-center justify-between gap-x-4">
            <span className="text-ui-fg-subtle flex items-center gap-x-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: c }} />
              {k}
            </span>
            <span className="text-ui-fg-base font-medium">{fmtNum(v)}</span>
          </div>
        ))}
        <div className="border-ui-border-base mt-0.5 flex items-center justify-between border-t pt-1">
          <span className="text-ui-fg-subtle">Etkileşim</span>
          <span className="text-ui-fg-base font-medium">%{p.engagementRate}</span>
        </div>
      </div>
    </div>
  )
}

// ── Views-per-post bar chart ──────────────────────────────
const ViewsChart = ({
  posts,
  color,
  id,
  height = 220,
}: {
  posts: PostAnalytics[]
  color: string
  id: string
  height?: number
}) => {
  const data = posts
    .slice()
    .reverse()
    .map((p, i) => ({ ...p, idx: `#${i + 1}` }))
  if (!data.length) {
    return (
      <div
        className="text-ui-fg-muted flex items-center justify-center"
        style={{ height }}
      >
        <Text size="small">Henüz gönderi yok.</Text>
      </div>
    )
  }
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="idx"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#71717a" }}
          />
          <Tooltip content={<PostTooltip />} cursor={{ fill: color, fillOpacity: 0.06 }} />
          <Bar dataKey="views" radius={[6, 6, 0, 0]} maxBarSize={48} fill={`url(#bar-${id})`} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Content distribution donut ────────────────────────────
const ContentDonut = ({ posts, total }: { posts: PostAnalytics[]; total: number }) => {
  const sorted = posts.slice().sort((a, b) => b.views - a.views)
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5).reduce((s, p) => s + p.views, 0)
  const data = [
    ...top.map((p) => ({ name: snippet(p.content, 20), value: p.views })),
    ...(rest > 0 ? [{ name: "diğer", value: rest }] : []),
  ].filter((d) => d.value > 0)

  if (!data.length) {
    return (
      <div className="text-ui-fg-muted flex h-[160px] items-center justify-center">
        <Text size="small">Veri yok.</Text>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-x-3">
      <div className="relative" style={{ width: 128, height: 128 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <Text size="small" weight="plus" className="tabular-nums leading-none">
            {fmtNum(total)}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted leading-none">
            görüntüleme
          </Text>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-x-1.5 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <span className="text-ui-fg-subtle truncate">{d.name}</span>
            <span className="text-ui-fg-muted ml-auto tabular-nums">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Posts table ───────────────────────────────────────────
const PostsTable = ({
  posts,
  bm,
  limit,
}: {
  posts: PostAnalytics[]
  bm: number
  limit: number
}) => (
  <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col rounded-xl border">
    <div className="flex items-center justify-between px-4 py-3">
      <Text weight="plus">Gönderiler</Text>
      <Text size="xsmall" className="text-ui-fg-muted">
        {posts.length} gönderi
      </Text>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-ui-fg-muted border-ui-border-base border-y text-xs uppercase">
          <tr>
            <th className="px-4 py-2 font-medium">İçerik</th>
            <th className="px-4 py-2 text-right font-medium">Görüntüleme</th>
            <th className="px-4 py-2 text-right font-medium">Beğeni</th>
            <th className="px-4 py-2 text-right font-medium">Paylaşım</th>
            <th className="px-4 py-2 text-right font-medium">Kaydetme</th>
            <th className="px-4 py-2 text-right font-medium">Etkileşim</th>
          </tr>
        </thead>
        <tbody className="divide-ui-border-base divide-y">
          {posts.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-ui-fg-muted px-4 py-6 text-center">
                Henüz gönderi yok.
              </td>
            </tr>
          ) : (
            posts.slice(0, limit).map((p) => (
              <tr key={p.id} className="hover:bg-ui-bg-base-hover">
                <td className="px-4 py-2.5">
                  <span className="line-clamp-1 max-w-[320px]">
                    {p.content || "(başlıksız)"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(p.views)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(p.likes)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(p.shares)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(p.saves)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className="font-medium tabular-nums"
                    style={{ color: p.engagementRate >= bm ? GREEN : RED }}
                  >
                    %{p.engagementRate}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)

// ── Per-account dashboard (tab-aware) ─────────────────────
const AccountDashboard = ({
  account,
  tab,
}: {
  account: SocialAccount
  tab: TabId
}) => {
  const { data, isLoading, isError, error } = useSocialAnalytics(account.id)
  const o = data?.analytics.overview
  const posts = data?.analytics.posts ?? []
  const color = colorOf(account.platform)
  const bm = benchmarkOf(account.platform)
  const er = o?.engagementRate ?? 0
  const nPosts = o?.publishedPosts || posts.length || 1

  if (isError) {
    return (
      <Text size="small" className="text-ui-fg-error">
        Analitik alınamadı: {(error as Error)?.message}
      </Text>
    )
  }

  const kpis: {
    label: string
    value: string
    sub?: string
    trend?: { up: boolean; text: string }
  }[] = [
    { label: "Görüntüleme", value: fmtNum(o?.totalViews ?? 0), sub: `${nPosts} gönderi` },
    {
      label: "Etkileşim oranı",
      value: `%${er}`,
      trend: o ? { up: er >= bm, text: `hedef %${bm}` } : undefined,
    },
    { label: "Ort. beğeni / gönderi", value: fmtNum((o?.totalLikes ?? 0) / nPosts), sub: "gönderi başına" },
    { label: "Ort. paylaşım / gönderi", value: fmtNum((o?.totalShares ?? 0) / nPosts), sub: "gönderi başına" },
    { label: "Kaydetme", value: fmtNum(o?.totalSaves ?? 0), sub: `${o?.saveRate ?? 0} / 1K görüntüleme` },
    {
      label: "İzlenme süresi",
      value: o && o.avgWatchTime > 0 ? `${o.avgWatchTime}sn` : "—",
      sub: "ortalama",
    },
  ]

  const verdict = o
    ? er >= bm
      ? "Etkileşim hedefin üstünde 👏"
      : `Etkileşim hedefin %${Math.round((1 - er / bm) * 100)} altında${o.saveRate === 0 && o.shareRate === 0 ? " · viral sinyal yok" : ""}`
    : ""

  // ── PROFILE tab ──
  if (tab === "profile") {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-3 rounded-xl border p-5 lg:col-span-1">
          <div className="flex items-center gap-x-3">
            <span
              className="flex size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <PlatformGlyph platform={account.platform} className="size-6" />
            </span>
            <div className="flex flex-col">
              <Text weight="plus">{account.displayName || labelOf(account.platform)}</Text>
              <Text size="small" className="text-ui-fg-muted">
                {account.username ? `@${account.username}` : labelOf(account.platform)}
              </Text>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Takipçi", fmtNum(account.followers)],
              ["Gönderi", String(account.posts)],
            ].map(([l, v]) => (
              <div key={l} className="border-ui-border-base bg-ui-bg-subtle rounded-lg border p-3">
                <Text size="xsmall" className="text-ui-fg-muted">
                  {l}
                </Text>
                <Text size="large" weight="plus" className="tabular-nums">
                  {v}
                </Text>
              </div>
            ))}
          </div>
          {account.profileUrl && (
            <Button variant="secondary" size="small" asChild>
              <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">
                Profili aç <ArrowUpRightOnBox />
              </a>
            </Button>
          )}
        </div>
        <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col items-start justify-center gap-y-1 rounded-xl border border-dashed p-5 lg:col-span-2">
          <Text weight="plus">Takipçi büyüme eğrisi</Text>
          <Text size="small" className="text-ui-fg-subtle">
            Büyüme grafiği için günlük snapshot gerekiyor. Snapshot job'u eklendiğinde
            takipçi/erişim trendi burada zaman serisi olarak çizilecek.
          </Text>
        </div>
      </div>
    )
  }

  // ── POST tab ──
  if (tab === "post") {
    return <PostsTable posts={posts} bm={bm} limit={50} />
  }

  // ── ENGAGEMENT tab ──
  if (tab === "engagement") {
    return (
      <div className="flex flex-col gap-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard
            label="Etkileşim oranı"
            value={`%${er}`}
            trend={o ? { up: er >= bm, text: `hedef %${bm}` } : undefined}
            loading={isLoading}
          />
          <KpiCard label="Kaydetme /1K" value={String(o?.saveRate ?? 0)} sub="görüntüleme başına" loading={isLoading} />
          <KpiCard label="Paylaşım /1K" value={String(o?.shareRate ?? 0)} sub="görüntüleme başına" loading={isLoading} />
          <KpiCard
            label="İzlenme"
            value={o && o.avgWatchTime > 0 ? `${o.avgWatchTime}sn` : "—"}
            sub="ortalama süre"
            loading={isLoading}
          />
        </div>
        <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-1 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <Text weight="plus">Gönderi performansı</Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              görüntüleme / gönderi
            </Text>
          </div>
          <ViewsChart posts={posts} color={color} id={account.id} height={260} />
        </div>
        <PostsTable posts={posts} bm={bm} limit={50} />
      </div>
    )
  }

  // ── OVERVIEW tab (default) ──
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} loading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-1 rounded-xl border p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Text weight="plus">Gönderi performansı</Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Her gönderinin görüntülemesi; üzerine gelince etkileşim kırılımı.
              </Text>
            </div>
          </div>
          <ViewsChart posts={posts} color={color} id={account.id} />
        </div>

        <div className="flex flex-col gap-y-4">
          <HighlightCard
            label="Etkileşim sağlığı"
            subtitle={`${labelOf(account.platform)} hedefi %${bm}`}
            value={`%${er}`}
            fillPct={bm ? (er / bm) * 100 : 0}
            loading={isLoading}
            footer={
              verdict ? (
                <Text size="xsmall" style={{ color: er >= bm ? GREEN : RED }}>
                  {verdict}
                </Text>
              ) : undefined
            }
          />
          <div className="border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-2 rounded-xl border p-4">
            <Text weight="plus">İçerik dağılımı</Text>
            <ContentDonut posts={posts} total={o?.totalViews ?? 0} />
          </div>
        </div>
      </div>

      <PostsTable posts={posts} bm={bm} limit={6} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────
export const Component = () => {
  const { data, isLoading, refetch } = useSocialAccounts()
  const connect = useConnectSocial()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>("overview")

  const configured = data?.configured ?? true
  const accounts = data?.accounts ?? []

  useEffect(() => {
    if (!selectedId && accounts.length) {
      const best = accounts.reduce((a, b) => (b.posts > a.posts ? b : a), accounts[0])
      setSelectedId(best.id)
    }
  }, [accounts, selectedId])

  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0]

  const onConnect = async (platform: string) => {
    try {
      const { authUrl } = await connect.mutateAsync(platform)
      window.open(authUrl, "_blank", "noopener,noreferrer")
      toast.info(`${labelOf(platform)} yetkilendirmesi yeni sekmede açıldı`, {
        description: "İzin verdikten sonra buraya dönüp Yenile'ye bas.",
      })
      setDrawerOpen(false)
    } catch (e) {
      toast.error("Bağlantı başlatılamadı", { description: (e as Error)?.message })
    }
  }

  return (
    <Container className="flex flex-col gap-y-5 p-6">
      <div className="flex items-center justify-between gap-x-3">
        <div className="flex items-center gap-x-2">
          <ChatBubbleLeftRight className="text-ui-fg-interactive" />
          <Heading level="h2">Social Media — Analiz</Heading>
        </div>
        <div className="flex items-center gap-x-2">
          <Button variant="transparent" size="small" onClick={() => refetch()}>
            Yenile
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)} disabled={!configured}>
            <Plus />
            Hesap bağla
          </Button>
        </div>
      </div>

      {!configured ? (
        <div className="border-ui-border-base flex items-start gap-x-3 rounded-xl border border-dashed p-5">
          <ExclamationCircle className="text-ui-fg-muted mt-0.5 shrink-0" />
          <div className="flex flex-col gap-y-0.5">
            <Text weight="plus">Sosyal sağlayıcı yapılandırılmamış</Text>
            <Text size="small" className="text-ui-fg-subtle">
              <code>helm/.env</code> içine <code>ZERNIO_API_KEY</code> ekleyip backend'i
              yeniden başlat.
            </Text>
          </div>
        </div>
      ) : isLoading ? (
        <Text size="small" className="text-ui-fg-muted">
          Yükleniyor…
        </Text>
      ) : accounts.length === 0 ? (
        <div className="border-ui-border-base text-ui-fg-subtle flex flex-col items-center gap-y-2 rounded-xl border border-dashed p-12 text-center">
          <ChartBar className="text-ui-fg-muted" />
          <Text size="small">Henüz bağlı hesap yok.</Text>
          <Button variant="secondary" size="small" onClick={() => setDrawerOpen(true)}>
            <Plus />
            Hesap bağla
          </Button>
        </div>
      ) : (
        <>
          {/* account selector */}
          <div className="flex flex-wrap items-center gap-2">
            {accounts.map((a) => {
              const on = a.id === selected?.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={clx(
                    "flex items-center gap-x-2 rounded-full border py-1.5 pl-2 pr-3.5 transition-colors",
                    on
                      ? "border-ui-border-interactive bg-ui-bg-base shadow-elevation-card-rest"
                      : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-base"
                  )}
                >
                  <span
                    className="flex size-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${colorOf(a.platform)}1a`, color: colorOf(a.platform) }}
                  >
                    <PlatformGlyph platform={a.platform} className="size-3.5" />
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-xs font-medium">
                      {a.username ? `@${a.username}` : labelOf(a.platform)}
                    </span>
                    <span className="text-ui-fg-muted text-[11px]">
                      {fmtNum(a.followers)} takipçi
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* tab bar */}
          <div className="flex items-center justify-between gap-x-3">
            <div className="bg-ui-bg-subtle inline-flex items-center gap-x-1 rounded-lg p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={clx(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === t.id
                      ? "bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest"
                      : "text-ui-fg-muted hover:text-ui-fg-base"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="border-ui-border-base text-ui-fg-subtle hidden items-center gap-x-1.5 rounded-lg border px-3 py-1.5 text-xs sm:flex">
              Tüm gönderiler
            </div>
          </div>

          {selected && <AccountDashboard key={selected.id + tab} account={selected} tab={tab} />}
        </>
      )}

      {/* connect drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Hesap bağla</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-2 overflow-y-auto">
            {PLATFORMS.map((p) => {
              const on = accounts.some((a) => a.platform === p.id)
              return (
                <div
                  key={p.id}
                  className="border-ui-border-base flex items-center gap-x-3 rounded-lg border p-3"
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${colorOf(p.id)}1a`, color: colorOf(p.id) }}
                  >
                    <PlatformGlyph platform={p.id} className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-y-0.5">
                    <Text size="small" weight="plus">
                      {p.label}
                    </Text>
                    <Badge size="2xsmall" color={on ? "green" : "grey"}>
                      {on ? "Bağlı" : "Bağlı değil"}
                    </Badge>
                  </div>
                  <Button
                    variant={on ? "secondary" : "primary"}
                    size="small"
                    className="ml-auto"
                    isLoading={connect.isPending && connect.variables === p.id}
                    onClick={() => onConnect(p.id)}
                  >
                    {on ? "Yeniden bağla" : "Bağla"}
                  </Button>
                </div>
              )
            })}
            <div className="border-ui-border-base text-ui-fg-subtle mt-1 flex items-start gap-x-2 rounded-lg border border-dashed p-3">
              <ArrowUpRightOnBox className="text-ui-fg-muted mt-0.5 shrink-0" />
              <Text size="xsmall">
                Bağlama, platformun resmi OAuth'unu yeni sekmede açar (sağlayıcı:
                Late/Zernio). İzin verince hesap otomatik bağlanır; dönüp Yenile'ye bas.
              </Text>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}
