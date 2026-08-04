import { Photo, Sparkles, Spinner } from "@medusajs/icons"
import { Button, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { removeImageBackground } from "./remove-bg"

type Source = { data: string; mime: string }

/**
 * Client-side background removal (@imgly, runs in the browser, free) via the
 * shared helper (single source with QuickActions). Result is a transparent PNG
 * added as a new version.
 */
export const BackgroundPanel = ({
  source,
  onResult,
  hasImage,
}: {
  source?: Source
  onResult: (dataUrl: string, label: string) => void
  hasImage: boolean
}) => {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!source || busy) {
      return
    }
    setBusy(true)
    try {
      const dataUrl = await removeImageBackground(source)
      onResult(dataUrl, "Arka plan temizlendi")
      toast.success("Arka plan temizlendi")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Arka plan temizlenemedi"
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <Sparkles className="text-ui-fg-interactive" />
        <Text weight="plus">Arka planı temizle</Text>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        Tek tıkla görselin arka planını kaldır; ürünü şeffaf zemine al. Tarayıcıda
        çalışır, ücretsiz.
      </Text>
      <Button
        variant="primary"
        onClick={run}
        disabled={!hasImage || busy}
        isLoading={busy}
        className="transition-transform duration-100 ease-out active:scale-[0.98]"
      >
        <Sparkles />
        Arka planı temizle
      </Button>
      {busy && (
        <div className="text-ui-fg-subtle flex items-center gap-x-2">
          <Spinner className="animate-spin" />
          <Text size="small">
            Model hazırlanıyor / arka plan kaldırılıyor (ilk seferde biraz
            sürebilir)…
          </Text>
        </div>
      )}
      <div className="border-ui-border-base flex items-start gap-x-2 border-t pt-3">
        <Photo className="text-ui-fg-muted mt-0.5 shrink-0" />
        <Text size="xsmall" className="text-ui-fg-subtle">
          {hasImage
            ? "Sonuç şeffaf PNG olur, yeni versiyon olarak eklenir."
            : "Önce soldan bir görsel ekle."}
        </Text>
      </div>
    </div>
  )
}
