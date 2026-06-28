import {
  Button,
  Checkbox,
  Drawer,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { PlatformGlyph } from "../../content/components/prompt-meta"
import { SocialAccount, usePublishSocial } from "../../../hooks/api/social"

/**
 * Compose a post and send it to selected connected accounts via the provider.
 * Defaults to DRAFT (no live post) so nothing publishes by accident; flip the
 * switch off to publish immediately.
 */
export const PublishComposer = ({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  accounts: SocialAccount[]
}) => {
  const publish = usePublishSocial()
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDraft, setIsDraft] = useState(true)

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
    try {
      const { result } = await publish.mutateAsync({
        content,
        targets,
        mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : undefined,
        isDraft,
      })
      toast.success(isDraft ? "Taslak oluşturuldu" : "Gönderildi", {
        description: `Durum: ${result.status}`,
      })
      setContent("")
      setMediaUrl("")
      setSelected(new Set())
      onOpenChange(false)
    } catch (e) {
      toast.error("Gönderilemedi", { description: (e as Error)?.message })
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Paylaş</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
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
            <Label size="small">Görsel/Video URL (opsiyonel)</Label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://… herkese açık URL"
            />
            <Text size="xsmall" className="text-ui-fg-muted">
              Sağlayıcı herkese açık URL ister; stüdyo görselini barındırınca
              otomatik buraya gelecek.
            </Text>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small">Hesaplar</Label>
            {accounts.length === 0 ? (
              <Text size="small" className="text-ui-fg-muted">
                Bağlı hesap yok.
              </Text>
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

          <div className="border-ui-border-base flex items-center justify-between gap-x-3 rounded-lg border p-3">
            <div className="flex min-w-0 flex-col">
              <Text size="small" weight="plus">
                Taslak olarak kaydet
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Açık: sağlayıcıda taslak (canlı post YOK). Kapalı: hemen yayınla.
              </Text>
            </div>
            <Switch checked={isDraft} onCheckedChange={setIsDraft} />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={submit} isLoading={publish.isPending}>
            {isDraft ? "Taslak oluştur" : "Yayınla"}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
