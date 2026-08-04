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
import { BgQuality, removeImageBackground } from "./remove-bg"

type Source = { data: string; mime: string }
type Glyph = React.ComponentType<{ className?: string }>

/**
 * Background-removal quality tiers — each has a different cost so the user picks
 * the trade-off per image. Higher tier = cleaner edges (hair/fabric) but a
 * bigger first-use model download; the model caches after the first run.
 */
const BG_TIERS: Array<{ q: BgQuality; label: string; hint: string }> = [
  { q: "small", label: "Hızlı", hint: "küçük indirme" },
  { q: "medium", label: "Dengeli", hint: "önerilen" },
  { q: "large", label: "En iyi", hint: "en temiz · büyük indirme" },
]

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
  // Which tier is currently removing (also the busy flag) — null when idle.
  const [bgRunning, setBgRunning] = useState<BgQuality | null>(null)
  const disabled = !hasImage || busy || bgRunning !== null

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

  // Background removal runs client-side (@imgly, free) via the shared helper.
  const removeBg = async (quality: BgQuality) => {
    if (!source || disabled) {
      return
    }
    setBgRunning(quality)
    try {
      onResult(await removeImageBackground(source, quality), "Arka plan temizlendi")
      toast.success("Arka plan temizlendi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Arka plan temizlenemedi")
    } finally {
      setBgRunning(null)
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
        {PRESETS.map((p) => (
          <Chip key={p.id} icon={p.Icon} label={p.label} onClick={() => apply(p.prompt)} />
        ))}
      </div>

      {/* Arka planı kaldır — kalite/bedel seçimi (her kademe farklı indirme + kenar) */}
      <div className="border-ui-border-base flex flex-col gap-y-1.5 rounded-lg border p-2.5">
        <div className="flex items-center gap-x-1.5">
          <Photo className="text-ui-fg-interactive shrink-0" />
          <Text size="xsmall" weight="plus">Arka planı kaldır</Text>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BG_TIERS.map((t) => (
            <button
              key={t.q}
              type="button"
              onClick={() => removeBg(t.q)}
              disabled={disabled}
              title={`${t.label} — ${t.hint}`}
              className={clx(
                "flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition-colors duration-100",
                disabled
                  ? "border-ui-border-base text-ui-fg-disabled cursor-not-allowed"
                  : bgRunning === t.q
                    ? "border-ui-border-interactive bg-ui-bg-base"
                    : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base"
              )}
            >
              <span className="flex items-center gap-x-1 text-xs font-medium">
                {bgRunning === t.q && <Spinner className="animate-spin" />}
                {t.label}
              </span>
              <span className="text-ui-fg-muted text-[10px] leading-tight">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {bgRunning !== null && (
        <div className="text-ui-fg-subtle flex items-center gap-x-2">
          <Spinner className="animate-spin" />
          <Text size="xsmall">
            {bgRunning === "large"
              ? "En iyi model indiriliyor (ilk seferde uzun sürebilir)…"
              : "Arka plan kaldırılıyor (ilk seferde biraz sürebilir)…"}
          </Text>
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
