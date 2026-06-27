import {
  DocumentText,
  LightBulb,
  Phone,
  Photo,
  Sparkles,
  Spinner,
  Swatch,
} from "@medusajs/icons"
import { Text, clx, toast } from "@medusajs/ui"
import { useState } from "react"

type Source = { data: string; mime: string }
type Glyph = React.ComponentType<{ className?: string }>

/**
 * One-tap edit presets that fill the rail with real, useful actions (instead of
 * a lone textarea). Each preset is an EDIT instruction that preserves the
 * uploaded image and only changes framing/lighting/quality around it.
 */
const PRESETS: Array<{ id: string; label: string; Icon: Glyph; prompt: string }> = [
  {
    id: "phone-frame",
    label: "Telefon çerçevesi",
    Icon: Phone,
    prompt:
      "Place this image inside a clean modern smartphone mockup centered on a soft neutral gradient background; keep the on-screen content fully intact, sharp and legible; do not redraw the UI.",
  },
  {
    id: "white-bg",
    label: "Beyaz zemin",
    Icon: Swatch,
    prompt:
      "Put the main subject on a clean seamless white studio background with soft natural shadows; keep the subject intact and unchanged.",
  },
  {
    id: "warm-light",
    label: "Sıcak ışık",
    Icon: LightBulb,
    prompt:
      "Add warm cinematic golden-hour lighting and a gentle glow; keep the subject and composition intact.",
  },
  {
    id: "enhance",
    label: "Parlat / yükselt",
    Icon: Sparkles,
    prompt:
      "Enhance to polished marketing quality: boost sharpness, vibrance and contrast, crisp and clean; keep the content intact.",
  },
  {
    id: "headline",
    label: "Başlık alanı",
    Icon: DocumentText,
    prompt:
      "Add a clean bold marketing headline banner area at the top in a modern poster style; keep the image content intact.",
  },
]

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export const QuickActions = ({
  source,
  onApply,
  onResult,
  hasImage,
  busy,
}: {
  source?: Source
  onApply: (prompt: string) => Promise<void>
  onResult: (dataUrl: string, label: string) => void
  hasImage: boolean
  busy: boolean
}) => {
  const [bgBusy, setBgBusy] = useState(false)
  const disabled = !hasImage || busy || bgBusy

  const apply = async (prompt: string) => {
    if (disabled) {
      return
    }
    try {
      await onApply(prompt)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uygulanamadı")
    }
  }

  // Background removal runs client-side (@imgly, free); dynamic-imported on use.
  const removeBg = async () => {
    if (!source || disabled) {
      return
    }
    setBgBusy(true)
    try {
      const { removeBackground } = await import("@imgly/background-removal")
      const blob = await removeBackground(`data:${source.mime};base64,${source.data}`)
      onResult(await blobToDataUrl(blob), "Arka plan temizlendi")
      toast.success("Arka plan temizlendi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Arka plan temizlenemedi")
    } finally {
      setBgBusy(false)
    }
  }

  const Chip = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: Glyph
    label: string
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clx(
        "flex items-center gap-x-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors duration-100",
        disabled
          ? "border-ui-border-base text-ui-fg-disabled cursor-not-allowed"
          : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base"
      )}
    >
      <span className={clx(!disabled && "text-ui-fg-interactive")}>
        <Icon />
      </span>
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-x-2">
        <Sparkles className="text-ui-fg-interactive" />
        <Text size="small" weight="plus">
          Hızlı düzenle
        </Text>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip icon={Photo} label="Arka planı kaldır" onClick={removeBg} />
        {PRESETS.map((p) => (
          <Chip key={p.id} icon={p.Icon} label={p.label} onClick={() => apply(p.prompt)} />
        ))}
      </div>
      {bgBusy && (
        <div className="text-ui-fg-subtle flex items-center gap-x-2">
          <Spinner className="animate-spin" />
          <Text size="xsmall">Arka plan kaldırılıyor (ilk seferde biraz sürebilir)…</Text>
        </div>
      )}
      {!hasImage && (
        <Text size="xsmall" className="text-ui-fg-muted">
          Tek tıkla uygula — önce soldan bir görsel ekle.
        </Text>
      )}
    </div>
  )
}
