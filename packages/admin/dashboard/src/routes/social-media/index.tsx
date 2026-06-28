import {
  ArrowUpRightOnBox,
  Bolt,
  ChartBar,
  ChatBubbleLeftRight,
  Clock,
  ExclamationCircle,
  Eye,
  Plus,
  Share,
  Sparkles,
  Star,
} from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { PlatformGlyph } from "../content/components/prompt-meta"
import {
  SocialAccount,
  useConnectSocial,
  useSocialAccounts,
  useSocialAnalytics,
} from "../../hooks/api/social"

// Connect-drawer platforms. id = provider connect path segment (Late/Zernio);
// account.platform echoes the same id.
const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "threads", label: "Threads" },
]
const labelOf = (id: string) =>
  PLATFORMS.find((p) => p.id === id)?.label ?? id

// Brand accents tuned to read on both dark + light surfaces.
const PLATFORM_COLOR: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#22D3EE",
  linkedin: "#0A66C2",
  x: "#A1A1AA",
  youtube: "#FF4D4D",
  facebook: "#1877F2",
  threads: "#A1A1AA",
}
const colorOf = (p: string) => PLATFORM_COLOR[p] ?? "#6366F1"

const fmtNum = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return String(n)
}

// Platform engagement-rate benchmarks (%). Drive the verdict + benchmark bar:
// at/above benchmark = green, half = orange, below = red. Source: 2026 norms.
const ENGAGEMENT_BENCHMARK: Record<string, number> = {
  tiktok: 4.25,
  instagram: 0.85,
  youtube: 1.6,
  facebook: 0.6,
  linkedin: 2,
  x: 0.45,
  threads: 1,
}
const benchmarkOf = (platform: string) => ENGAGEMENT_BENCHMARK[platform] ?? 1
type Tier = "green" | "orange" | "red"
const engagementTier = (platform: string, rate: number): Tier => {
  const bm = benchmarkOf(platform)
  if (rate >= bm) return "green"
  if (rate >= bm * 0.5) return "orange"
  return "red"
}
const TIER_HEX: Record<Tier, string> = {
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444",
}
const TIER_WORD: Record<Tier, string> = {
  green: "İyi",
  orange: "Orta",
  red: "Zayıf",
}

// One-line plain-language verdict: where the account stands + what to fix.
const verdictText = (
  platform: string,
  rate: number,
  saveRate: number,
  shareRate: number
): string => {
  const bm = benchmarkOf(platform)
  const tier = engagementTier(platform, rate)
  const parts: string[] = []
  if (rate >= bm) {
    parts.push(`etkileşim hedefin üstünde`)
  } else {
    const gap = Math.round((1 - rate / bm) * 100)
    parts.push(`etkileşim hedefin %${gap} altında`)
  }
  if (saveRate === 0 && shareRate === 0) parts.push("viral sinyal yok")
  return `${TIER_WORD[tier]} — ${parts.join(", ")}`
}

/** One connected account: live insights (verdict + benchmark + best content). */
const AccountCard = ({
  account,
  index,
}: {
  account: SocialAccount
  index: number
}) => {
  const { data, isLoading, isError, error } = useSocialAnalytics(account.id)
  const o = data?.analytics.overview
  const posts = data?.analytics.posts ?? []
  const color = colorOf(account.platform)
  const bm = benchmarkOf(account.platform)
  const er = o?.engagementRate ?? 0
  const tier = engagementTier(account.platform, er)
  const fillPct = Math.min(100, bm ? (er / bm) * 100 : 0)
  const bestPost = posts.length
    ? posts.reduce((b, p) => (p.engagementRate > b.engagementRate ? p : b), posts[0])
    : null

  return (
    <div
      className="border-ui-border-base bg-ui-bg-base hover:border-ui-border-strong animate-in fade-in-0 slide-in-from-bottom-3 motion-reduce:animate-none flex flex-col gap-y-3 rounded-xl border p-3.5 shadow-elevation-card-rest transition-colors duration-500"
      style={{ animationDelay: `${index * 90}ms`, animationFillMode: "backwards" }}
    >
      {/* header */}
      <div className="flex items-center gap-x-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <PlatformGlyph platform={account.platform} className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <Text weight="plus" leading="compact">
            {account.displayName || labelOf(account.platform)}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted leading-none">
            {account.username ? `@${account.username}` : labelOf(account.platform)}
            {" · "}
            {fmtNum(account.followers)} takipçi
            {o ? ` · ${fmtNum(o.totalViews)} görüntüleme` : ""}
          </Text>
        </div>
        <Badge size="2xsmall" className="ml-1" color="green">
          Bağlı
        </Badge>
        {account.profileUrl && (
          <a
            href={account.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ui-fg-muted hover:text-ui-fg-base ml-auto"
            title="Profili aç"
          >
            <ArrowUpRightOnBox />
          </a>
        )}
      </div>

      {/* hero: engagement vs platform benchmark + plain-language verdict */}
      <div className="flex flex-col gap-y-1.5">
        <div className="flex items-baseline justify-between">
          <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wide">
            Etkileşim oranı
          </Text>
          <Text
            size="xlarge"
            weight="plus"
            className="tabular-nums leading-none"
            style={{ color: o ? TIER_HEX[tier] : undefined }}
          >
            {o ? `%${er}` : isLoading ? "···" : "—"}
          </Text>
        </div>
        <div className="bg-ui-bg-subtle relative h-2 w-full overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${fillPct}%`, backgroundColor: TIER_HEX[tier] }}
          />
        </div>
        <div className="flex items-center justify-between gap-x-2">
          <Text
            size="xsmall"
            weight="plus"
            style={{ color: o ? TIER_HEX[tier] : undefined }}
          >
            {o
              ? verdictText(account.platform, er, o.saveRate, o.shareRate)
              : isLoading
                ? "Analiz ediliyor…"
                : ""}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted shrink-0">
            hedef %{bm}
          </Text>
        </div>
      </div>

      {/* secondary signals — inline, quiet */}
      <div className="text-ui-fg-subtle flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
        <span className="flex items-center gap-x-1" title="Kaydetme / 1K görüntüleme">
          <Star className="text-ui-fg-muted" /> {o ? o.saveRate : "—"} kaydetme/1K
        </span>
        <span className="flex items-center gap-x-1" title="Paylaşım / 1K görüntüleme">
          <Share className="text-ui-fg-muted" /> {o ? o.shareRate : "—"} paylaşım/1K
        </span>
        <span className="flex items-center gap-x-1" title="Ortalama izlenme süresi">
          <Clock className="text-ui-fg-muted" />{" "}
          {o && o.avgWatchTime > 0 ? `${o.avgWatchTime}sn` : "—"} izlenme
        </span>
        <span className="flex items-center gap-x-1" title="Toplam erişim">
          <Eye className="text-ui-fg-muted" />{" "}
          {o ? fmtNum(o.totalReach || o.totalViews) : "—"} erişim
        </span>
      </div>

      {isError ? (
        <Text size="xsmall" className="text-ui-fg-error">
          Analitik alınamadı: {(error as Error)?.message}
        </Text>
      ) : posts.length > 0 ? (
        <>
          {bestPost && (
            <div className="bg-ui-bg-subtle flex items-center gap-x-2 rounded-lg px-3 py-2">
              <Sparkles className="text-ui-tag-green-icon shrink-0" />
              <Text
                size="xsmall"
                className="text-ui-fg-muted shrink-0 uppercase tracking-wide"
              >
                En iyi
              </Text>
              <Text size="small" className="line-clamp-1 flex-1">
                {bestPost.content || "(başlıksız)"}
              </Text>
              <Text size="small" weight="plus" className="shrink-0 tabular-nums">
                %{bestPost.engagementRate}
              </Text>
            </div>
          )}

          <div className="flex flex-col gap-y-1.5">
            <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wide">
              Son gönderiler
            </Text>
            {posts.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="border-ui-border-base relative flex items-center gap-x-3 overflow-hidden rounded-lg border px-3 py-2"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 left-0"
                  style={{
                    width: `${(p.engagementRate / (bestPost?.engagementRate || 1)) * 100}%`,
                    backgroundColor: color,
                    opacity: 0.07,
                  }}
                />
                <Text size="small" className="line-clamp-1 z-10 flex-1">
                  {p.content || "(başlıksız)"}
                </Text>
                <div className="text-ui-fg-subtle z-10 flex shrink-0 items-center gap-x-3 text-xs tabular-nums">
                  <span className="flex items-center gap-x-1" title="Görüntüleme">
                    <Eye className="text-ui-fg-muted" />
                    {fmtNum(p.views)}
                  </span>
                  <span className="flex items-center gap-x-1" title="Paylaşım">
                    <Share className="text-ui-fg-muted" />
                    {fmtNum(p.shares)}
                  </span>
                  <span className="flex items-center gap-x-1" title="Kaydetme">
                    <Star className="text-ui-fg-muted" />
                    {fmtNum(p.saves)}
                  </span>
                  <span className="flex items-center gap-x-1" title="Etkileşim oranı">
                    <Bolt className="text-ui-fg-muted" />%{p.engagementRate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Text size="small" className="text-ui-fg-muted">
          Bu hesapta henüz gönderi yok.
        </Text>
      )}
    </div>
  )
}

/** Social Media → Analiz: connect accounts (hosted OAuth) + read their insights. */
export const Component = () => {
  const { data, isLoading, refetch } = useSocialAccounts()
  const connect = useConnectSocial()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const configured = data?.configured ?? true
  const accounts = data?.accounts ?? []

  const onConnect = async (platform: string) => {
    try {
      const { authUrl } = await connect.mutateAsync(platform)
      window.open(authUrl, "_blank", "noopener,noreferrer")
      toast.info(`${labelOf(platform)} yetkilendirmesi yeni sekmede açıldı`, {
        description: "İzin verdikten sonra buraya dönüp Yenile'ye bas.",
      })
      setDrawerOpen(false)
    } catch (e) {
      toast.error("Bağlantı başlatılamadı", {
        description: (e as Error)?.message,
      })
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-x-3 px-6 py-4">
        <div className="flex items-center gap-x-2">
          <ChatBubbleLeftRight className="text-ui-fg-interactive" />
          <Heading level="h2">Social Media — Analiz</Heading>
        </div>
        <Button
          variant="secondary"
          onClick={() => setDrawerOpen(true)}
          disabled={!configured}
        >
          <Plus />
          Hesap bağla
        </Button>
      </div>

      {!configured ? (
        <div className="flex items-start gap-x-3 px-6 py-5">
          <ExclamationCircle className="text-ui-fg-muted mt-0.5 shrink-0" />
          <div className="flex flex-col gap-y-0.5">
            <Text weight="plus">Sosyal sağlayıcı yapılandırılmamış</Text>
            <Text size="small" className="text-ui-fg-subtle">
              <code>helm/.env</code> içine <code>ZERNIO_API_KEY</code> ekleyip
              backend'i yeniden başlat. Bağlama + analitik bu sağlayıcı (Late/Zernio)
              üzerinden gelir.
            </Text>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-y-6 p-6">
          {/* Bağlı hesaplar */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <Text weight="plus">Bağlı hesaplar</Text>
              <div className="flex items-center gap-x-3">
                <Text size="xsmall" className="text-ui-fg-muted">
                  {accounts.length} bağlı
                </Text>
                <Button
                  variant="transparent"
                  size="small"
                  onClick={() => refetch()}
                >
                  Yenile
                </Button>
              </div>
            </div>

            {isLoading ? (
              <Text size="small" className="text-ui-fg-muted">
                Yükleniyor…
              </Text>
            ) : accounts.length === 0 ? (
              <div className="border-ui-border-base text-ui-fg-subtle flex items-center justify-between gap-x-3 rounded-lg border border-dashed p-4">
                <Text size="small">Henüz bağlı hesap yok.</Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Plus />
                  Hesap bağla
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <span
                    key={a.id}
                    className="bg-ui-bg-base border-ui-border-base flex items-center gap-x-1.5 rounded-full border py-1 pl-2.5 pr-3 text-xs font-medium"
                    style={{ color: colorOf(a.platform) }}
                  >
                    <PlatformGlyph
                      platform={a.platform}
                      className="size-3.5 shrink-0"
                    />
                    <span className="text-ui-fg-base">
                      {a.username ? `@${a.username}` : labelOf(a.platform)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Analizler */}
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center gap-x-2">
              <ChartBar className="text-ui-fg-subtle" />
              <Text weight="plus">Hesap analizleri</Text>
            </div>
            {accounts.length === 0 ? (
              <div className="border-ui-border-base text-ui-fg-subtle flex flex-col items-center gap-y-1 rounded-xl border border-dashed p-10 text-center">
                <ChartBar className="text-ui-fg-muted" />
                <Text size="small">
                  Hesap bağla; takipçi, görüntüleme ve etkileşim içgörüleri burada
                  görünür.
                </Text>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
                  gap: "1rem",
                }}
              >
                {accounts.map((a, i) => (
                  <AccountCard key={a.id} account={a} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hesap bağlama drawer'ı — hosted OAuth */}
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
                    style={{
                      backgroundColor: `${colorOf(p.id)}1a`,
                      color: colorOf(p.id),
                    }}
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
                Late/Zernio). İzin verince hesap otomatik bağlanır; dönüp
                Yenile'ye bas.
              </Text>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}
