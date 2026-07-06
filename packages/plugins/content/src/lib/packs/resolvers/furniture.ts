/**
 * Bega Home mobilya vocabulary resolver'ları — `generate-images.ts`'ten birebir
 * port (kanıtlanmış model). Ham katalog alanı (color, legs, style, name) →
 * zengin İngilizce görsel dili. Hepsi SAF ve TOTAL: her zaman bir string döner,
 * asla boş/undefined bırakmaz → determinizm garantisi.
 */

import type { Resolver, ResolverSet } from "../types"

// {COLOR} kısa etiketi (map'te yoksa ham değer). Bega `|| product.color` ile bire bir.
const colorShort: Record<string, string> = {
  walnut: "walnut",
  white: "white lacquered",
  beige: "beige fabric",
  grey: "grey fabric",
  mixed: "neutral toned",
  "two-tone": "two-tone white and oak",
}

// {LEGS} açıklaması.
const legsDesc: Record<string, string> = {
  tapered: "tapered conical legs",
  straight: "straight square legs",
  cabriole: "elegant curved cabriole legs",
  "h-frame": "H-frame country style legs",
  curved: "gently curved legs",
  cross: "angled cross legs",
  grid: "open grid frame structure",
  slim: "slim rounded profile legs",
  cylinder: "cylindrical turned legs",
  "c-frame": "curved C-shaped continuous frame",
  low: "low-profile base with walnut wood accents",
  angled: "angled dark wood legs",
  walnut: "solid walnut mid-century frame",
  metal: "slim metal legs",
}

// {SURFACE} — tabla yüzey dokusu.
const getSurface = (color: string): string => {
  if (color === "walnut") return "rich walnut wood grain with light-to-dark striped pattern"
  if (color === "white") return "smooth matte white lacquer finish"
  if (color === "two-tone") return "contrasting white surface with natural oak edge"
  return "clean finished surface"
}

/**
 * {COUNT} — zigon takım adedi. Bega'da `name.includes("4")` çıplak "4"yi
 * yakalıyordu ve "Model 41" gibi isimleri yanlışlıkla "four" yapıyordu (bug).
 * Burada "4lu"/"4lü"/"4'lü" kalıbına daraltıldı — determinizm korunur, isabet artar.
 */
const getNestCount = (_style: string, name: string): string =>
  /4['’]?l[uü]/i.test(name ?? "") ? "four" : "three"

// {SOFA_COLOR} — sahnedeki kanepe rengi.
const getSofaColor = (color: string): string => {
  if (color === "walnut" || color === "two-tone") return "beige linen"
  if (color === "white") return "light grey"
  return "beige"
}

// {FABRIC_DESC} — döşeme kumaşı.
const getFabricDesc = (color: string): string => {
  if (color === "beige") return "smooth beige linen fabric"
  if (color === "grey") return "textured light grey upholstery"
  if (color === "mixed") return "neutral earth-tone mixed fabric"
  return "premium upholstery fabric"
}

// {WOOD_DESC} — ahşap tonu.
const getWoodDesc = (color: string): string => {
  if (color === "beige" || color === "grey") return "rich dark walnut wood"
  return "natural walnut wood"
}

/**
 * TOKEN → resolver kaydı. Template'teki `{COLOR}` bu map'in COLOR fonksiyonuna
 * bağlanır. Bega `fillTemplate`'in `.replace` zincirinin data-driven karşılığı.
 */
export const furnitureResolvers: ResolverSet = {
  COLOR: (m) => colorShort[m.color] || m.color,
  LEGS: (m) => legsDesc[m.legs] || m.legs,
  SURFACE: (m) => getSurface(m.color),
  COUNT: (m) => getNestCount(m.style, m.name),
  SOFA_COLOR: (m) => getSofaColor(m.color),
  FABRIC_DESC: (m) => getFabricDesc(m.color),
  WOOD_DESC: (m) => getWoodDesc(m.color),
}

// Tekil resolver'ları da dışa aç (test + ileride #0013 seating için).
export const _internals: Record<string, Resolver | ((...a: string[]) => string)> = {
  getSurface,
  getNestCount,
  getSofaColor,
  getFabricDesc,
  getWoodDesc,
}
