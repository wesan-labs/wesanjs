import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlatformGlyph } from "../../content/components/prompt-meta"
import { accountsRequireMedia } from "../../../lib/social-platform-rules"
import { usePublishSocial, useSocialAccounts } from "../../../hooks/api/social"

type Mode = "draft" | "schedule" | "now"

/**
 * Compose a post and send it to selected connected accounts via the provider.
 * Self-contained (fetches its own accounts) so it can be dropped into the studio
 * too. Defaults to DRAFT — nothing publishes by accident. Accepts initial caption
 * + image preview for the generate→publish loop.
 */
export const PublishComposer = ({
  open,
  onOpenChange,
  initialContent,
  initialImage,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialContent?: string
  initialImage?: string
}) => {
  const { data } = useSocialAccounts()
  const accounts = data?.accounts ?? []
  const imageHost = data?.imageHost ?? false
  const noAccounts = accounts.length === 0
  const publish = usePublishSocial()
  const navigate = useNavigate()

  const [content, setContent] = useState(initialContent ?? "")
  const [mediaUrl, setMediaUrl] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<Mode>("draft")
  const [when, setWhen] = useState<Date | null>(null)
  const [sendImage, setSendImage] = useState(false)

  const mediaPlatforms = useMemo(
    () => accountsRequireMedia(accounts, selected),
    [accounts, selected]
  )
  const needsMedia = mediaPlatforms.length > 0
  const hasMedia =
    !!mediaUrl.trim() || (sendImage && !!initialImage && imageHost)

  // Sync caption + default the image toggle when the drawer opens.
  useEffect(() => {
    if (!open) return
    if (initialContent != null) setContent(initialContent)
    setSendImage(!!initialImage && imageHost)
  }, [open, initialContent, initialImage, imageHost])

  // Instagram/TikTok etc. selected → auto-attach studio image when hosting is on.
  useEffect(() => {
    if (!open || !needsMedia || !initialImage || !imageHost) return
    setSendImage(true)
  }, [open, needsMedia, initialImage, imageHost])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const submit = async () => {
    if (!content.trim()) {
      toast.error("Metin gerekli")
      return
    }
    const targets = accounts
      .filter((a) => selected.has(a.id))
      .map((a) => ({ platform: a.platform, accountId: a.id }))
    if (!targets.length) {
      toast.error("En az bir hesap seç")
      return
    }
    if (mode === "schedule" && !when) {
      toast.error("Tarih ve saat seç")
      return
    }
    if (needsMedia && !hasMedia) {
      toast.error("Görsel veya video gerekli", {
        description:
          `${mediaPlatforms.join(", ")} için herkese açık medya URL'i girin` +
          (initialImage && !imageHost
            ? " (stüdyo görseli: platform görsel barındırma henüz açılmamış)."
            : initialImage
              ? " veya «Görseli de gönder» açık olsun."
              : "."),
      })
      return
    }
    try {
      const { result } = await publish.mutateAsync({
        content,
        targets,
        mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : undefined,
        mediaDataUrls: sendImage && initialImage ? [initialImage] : undefined,
        isDraft: mode === "draft",
        scheduledFor: mode === "schedule" && when ? when.toISOString() : undefined,
      })
      toast.success(
        mode === "draft"
          ? "Taslak oluşturuldu"
          : mode === "schedule"
            ? "Zamanlandı"
            : "Gönderildi",
        { description: `Durum: ${result.status}` }
      )
      setContent("")
      setMediaUrl("")
      setSelected(new Set())
      setWhen(null)
      setMode("draft")
      onOpenChange(false)
    } catch (e) {
      toast.error("Gönderilemedi", { description: (e as Error)?.message })
    }
  }

  const cta =
    mode === "draft" ? "Taslak oluştur" : mode === "schedule" ? "Zamanla" : "Yayınla"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Paylaş</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          {needsMedia && !hasMedia && (
            <div className="border-ui-border-error bg-ui-bg-error-subtle rounded-lg border p-3">
              <Text size="small" weight="plus" className="text-ui-fg-error">
                {mediaPlatforms.join(", ")} görsel veya video olmadan paylaşım kabul etmez.
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                Aşağıya public URL girin
                {initialImage && imageHost
                  ? " veya stüdyo görselini gönderin."
                  : initialImage
                    ? " — stüdyo görseli için platform görsel barındırma gerekli."
                    : "."}
              </Text>
            </div>
          )}

          {initialImage && (
            <div className="flex flex-col gap-y-2">
              <Label size="small">Stüdyo görseli</Label>
              <img
                src={initialImage}
                alt="Stüdyo görseli"
                className="border-ui-border-base max-h-48 w-full rounded-lg border object-contain"
              />
              <div className="border-ui-border-base flex items-center justify-between gap-x-3 rounded-lg border p-3">
                <div className="flex min-w-0 flex-col">
                  <Text size="small" weight="plus">
                    Görseli de gönder
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {imageHost
                      ? "Platform görsel barındırma açık — yayında otomatik public URL oluşur."
                      : "Görsel yükleme platformda kapalı — public medya URL'i girin."}
                  </Text>
                </div>
                <Switch
                  checked={sendImage}
                  onCheckedChange={setSendImage}
                  disabled={!imageHost}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-y-1.5">
            <Label size="small">Metin</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Gönderi metni / caption…"
              rows={5}
            />
          </div>

          <div className="flex flex-col gap-y-1.5">
            <Label size="small">
              Görsel/Video URL{needsMedia ? " (zorunlu)" : " (opsiyonel)"}
            </Label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://… herkese açık URL"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small">Hesaplar</Label>
            {noAccounts ? (
              <div className="border-ui-border-base bg-ui-bg-subtle flex flex-col items-start gap-y-2 rounded-lg border border-dashed p-3">
                <Text size="small" className="text-ui-fg-subtle">
                  Henüz bağlı sosyal hesap yok. Paylaşmak için önce bir hesap bağla.
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => {
                    onOpenChange(false)
                    navigate("/social-media")
                  }}
                >
                  Hesap bağla
                </Button>
              </div>
            ) : (
              accounts.map((a) => (
                <label
                  key={a.id}
                  className="border-ui-border-base hover:bg-ui-bg-base-hover flex cursor-pointer items-center gap-x-3 rounded-lg border p-2.5"
                >
                  <Checkbox
                    checked={selected.has(a.id)}
                    onCheckedChange={() => toggle(a.id)}
                  />
                  <PlatformGlyph platform={a.platform} className="text-ui-fg-subtle size-4" />
                  <Text size="small">
                    {a.username ? `@${a.username}` : a.platform}
                  </Text>
                </label>
              ))
            )}
          </div>

          <div className="flex flex-col gap-y-1.5">
            <Label size="small">Yayın</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="draft">Taslak olarak kaydet (önerilen)</Select.Item>
                <Select.Item value="schedule">Zamanla</Select.Item>
                <Select.Item value="now">Hemen yayınla</Select.Item>
              </Select.Content>
            </Select>
            {mode === "schedule" && (
              <DatePicker
                granularity="minute"
                value={when}
                onChange={setWhen}
              />
            )}
            <Text size="xsmall" className="text-ui-fg-muted">
              {mode === "draft"
                ? "Sağlayıcıda taslak — canlı post YOK."
                : mode === "schedule"
                  ? "Seçilen zamanda otomatik yayınlanır."
                  : "Seçili hesaplara hemen gönderilir."}
            </Text>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={submit}
            isLoading={publish.isPending}
            disabled={noAccounts || (needsMedia && !hasMedia)}
          >
            {cta}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
