import {
  ChartBar,
  ChatBubbleLeftRight,
  InformationCircle,
  Plus,
  XMarkMini,
} from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import { PlatformGlyph } from "../content/components/prompt-meta"

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
]

const STORAGE_KEY = "social-connected"
const loadConnected = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
  } catch {
    return new Set()
  }
}

const METRICS = [
  { key: "followers", label: "Takipçi" },
  { key: "engagement", label: "Etkileşim" },
  { key: "reach", label: "Erişim" },
  { key: "top", label: "En iyi gönderi" },
]

/** Honest scaffold note — real OAuth/analytics need each platform API. */
const ApiNote = ({ text }: { text: string }) => (
  <div className="border-ui-border-base text-ui-fg-subtle flex items-start gap-x-2 rounded-lg border border-dashed p-3">
    <InformationCircle className="text-ui-fg-muted mt-0.5 shrink-0" />
    <Text size="xsmall">{text}</Text>
  </div>
)

/** Social Media → Analiz: connect accounts (drawer) + read their insights. */
export const Component = () => {
  const [connected, setConnected] = useState<Set<string>>(loadConnected)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggle = (id: string) =>
    setConnected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-x-3 px-6 py-4">
        <div className="flex items-center gap-x-2">
          <ChatBubbleLeftRight className="text-ui-fg-interactive" />
          <Heading level="h2">Social Media — Analiz</Heading>
        </div>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          <Plus />
          Hesap bağla
        </Button>
      </div>

      <div className="flex flex-col gap-y-6 p-6">
        {/* Bağlı hesaplar — kompakt */}
        <div className="flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
            <Text weight="plus">Bağlı hesaplar</Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {connected.size} bağlı
            </Text>
          </div>
          {connected.size === 0 ? (
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
              {[...connected].map((id) => {
                const p = PLATFORMS.find((x) => x.id === id)
                return (
                  <span
                    key={id}
                    className="bg-ui-bg-base border-ui-border-base flex items-center gap-x-1.5 rounded-full border py-1 pl-2.5 pr-1 text-xs font-medium"
                  >
                    <PlatformGlyph
                      platform={id}
                      className="text-ui-fg-subtle size-3.5 shrink-0"
                    />
                    {p?.label ?? id}
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="text-ui-fg-muted hover:text-ui-fg-base"
                      title="Bağlantıyı kes"
                    >
                      <XMarkMini />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Analizler */}
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center gap-x-2">
            <ChartBar className="text-ui-fg-subtle" />
            <Text weight="plus">Hesap analizleri</Text>
          </div>
          {connected.size === 0 ? (
            <div className="border-ui-border-base text-ui-fg-subtle flex flex-col items-center gap-y-1 rounded-xl border border-dashed p-10 text-center">
              <ChartBar className="text-ui-fg-muted" />
              <Text size="small">
                Hesap bağla; takipçi, etkileşim ve erişim içgörüleri burada görünür.
              </Text>
            </div>
          ) : (
            <>
              {[...connected].map((id) => {
                const p = PLATFORMS.find((x) => x.id === id)
                return (
                  <div key={id} className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-x-2">
                      <PlatformGlyph
                        platform={id}
                        className="text-ui-fg-subtle size-4 shrink-0"
                      />
                      <Text weight="plus">{p?.label ?? id}</Text>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {METRICS.map((m) => (
                        <div
                          key={m.key}
                          className="border-ui-border-base flex flex-col gap-y-1 rounded-lg border p-3"
                        >
                          <Text
                            size="xsmall"
                            className="text-ui-fg-muted uppercase tracking-wide"
                          >
                            {m.label}
                          </Text>
                          <Text size="large" weight="plus" className="text-ui-fg-muted">
                            —
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              <ApiNote text="Gerçek metrikler platform API'lerinden (Insights/Analytics) gelir — bağlantı entegrasyonu yapıldığında dolacak." />
            </>
          )}
        </div>
      </div>

      {/* Hesap bağlama drawer'ı */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Hesap bağla</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-2 overflow-y-auto">
            {PLATFORMS.map((p) => {
              const on = connected.has(p.id)
              return (
                <div
                  key={p.id}
                  className="border-ui-border-base flex items-center gap-x-3 rounded-lg border p-3"
                >
                  <PlatformGlyph
                    platform={p.id}
                    className="text-ui-fg-subtle size-5 shrink-0"
                  />
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
                    onClick={() => toggle(p.id)}
                  >
                    {on ? "Kes" : "Bağla"}
                  </Button>
                </div>
              )
            })}
            <ApiNote text="Bağlama şimdilik demo. Gerçek bağlantı her platformun OAuth'unu (app kaydı + token) ya da bir sağlayıcıyı (Ayrshare/getlate) ister." />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}
