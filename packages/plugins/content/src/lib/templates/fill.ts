import type { BrandIdentity } from "../brand/types"
import type { FillData, SlotBind, Template } from "./types"

/** bind türü → sahne node'unda okunacak/yazılacak attr (resolve.attrFor ile hizalı). */
const attrForBind: Record<SlotBind["kind"], string> = {
  text: "text", color: "fill", font: "fontFamily", logo: "src", image: "src",
}

/** bind türü → FillData ayrık-birleşim türü. */
const fillKindForBind = (kind: SlotBind["kind"]): "text" | "color" | "font" | "image" =>
  kind === "logo" ? "image" : kind

const isHex = (v?: string): v is string =>
  !!v && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim())

/** template'te bu slot'a bağlı node'un authored attr değeri (marka boşsa fallback). */
const authoredValue = (template: Template, slotId: string, attr: string): string => {
  let found = ""
  const walk = (nodes: Template["scene"]["nodes"]) => {
    for (const n of nodes) {
      if (n.slotId === slotId) found = String(n.attrs[attr] ?? "")
      if (n.children) walk(n.children)
    }
  }
  walk(template.scene.nodes)
  return found
}

/** marka renk paletinden rol'e karşılık gelen geçerli hex (yoksa undefined). */
const brandColor = (brand: BrandIdentity, role: "primary" | "secondary" | "accent"): string | undefined => {
  const c = brand.visual?.colors
  const candidate = role === "primary" ? c?.primary : role === "secondary" ? c?.secondary : c?.accent
  if (isHex(candidate)) return candidate
  // secondary/accent yoksa primary'ye düş (yine geçerli hex ise)
  return isHex(c?.primary) ? c?.primary : undefined
}

/** deterministik marka-kopyası (LLM YOK — Faz 2 kredi-gated kopya bunu değiştirir). */
const brandCopy = (brand: BrandIdentity, role: "headline" | "body" | "cta" | "custom", maxLen?: number): string => {
  let text: string
  switch (role) {
    case "headline": text = brand.tagline?.trim() || brand.name; break
    case "body": text = brand.positioning?.trim() || brand.offering?.trim() || brand.name; break
    case "cta": text = "Keşfet"; break
    default: text = brand.name // custom (eyebrow/kicker)
  }
  return maxLen && text.length > maxLen ? text.slice(0, maxLen).trimEnd() : text
}

export interface FillOptions {
  /** kullanıcı-yüklediği görsel (image slot) — data/http URL */
  media?: string
  /** marka logosu URL'i (logo slot) */
  logo?: string
}

/**
 * Template + marka → her slot için fill değeri (DETERMINISTIK, KREDISIZ).
 * color/logo/media → marka token / kullanıcı medyası; text → deterministik
 * marka-kopyası (LLM sonra). Marka bir değeri sağlamıyorsa template'in authored
 * değeri korunur → resolveScene asla "fill yok" ile patlamaz.
 * Time: O(slot · node). Space: O(slot).
 */
export const buildFillData = (template: Template, brand: BrandIdentity, opts: FillOptions = {}): FillData => {
  const fill: FillData = {}
  for (const slot of template.slots) {
    const bind = slot.bind
    const authored = authoredValue(template, slot.id, attrForBind[bind.kind])
    let value: string
    switch (bind.kind) {
      case "text": value = brandCopy(brand, bind.role, bind.maxLen) || authored; break
      case "color": value = brandColor(brand, bind.role) ?? authored; break
      case "logo": value = opts.logo ?? authored; break
      case "image": value = opts.media ?? authored; break
      default: value = authored // font — BrandIdentity'de font yok, authored korunur
    }
    fill[slot.id] = { kind: fillKindForBind(bind.kind), value }
  }
  return fill
}
