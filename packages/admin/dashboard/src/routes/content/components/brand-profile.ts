/**
 * Brand profile: the stable brand/product variables a user fills ONCE and that
 * auto-fill every prompt's matching {{VARIABLE}}s — so they don't re-type their
 * brand for each generation. Stored in localStorage (per-browser); content-
 * specific variables (TOPIC, ROOM, SEASON…) stay per-prompt.
 */
export const BRAND_VARS = [
  "BRAND_NAME",
  "BRAND_VOICE",
  "PRODUCT_NAME",
  "PRODUCT_CATEGORY",
  "KEY_FEATURE",
  "BENEFIT",
  "TARGET_AUDIENCE",
  "TONE",
  "CTA",
  "OFFER",
  "COLOR",
  "INTERIOR_STYLE",
  "HASHTAG_COUNT",
  "WEBSITE",
  "SOCIAL",
] as const

const STORAGE_KEY = "content-studio-brand-profile"

export type BrandProfile = Record<string, string>

export const loadBrandProfile = (): BrandProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BrandProfile) : {}
  } catch {
    return {}
  }
}

export const saveBrandProfile = (profile: BrandProfile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // ignore quota / private-mode errors
  }
}

/** Non-empty profile values, for merging into prompt variables. */
export const profileValues = (profile: BrandProfile): BrandProfile =>
  Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v != null && v.trim() !== "")
  )

/**
 * İnsan-okunur alan etiketleri — brand var'ları + pack metadata anahtarları.
 * Ham token ("GAME_NAME", "legs") UI'da görünmesin diye tek kaynak (drawer +
 * PackPicker paylaşır). Kapsanmayan anahtar → generic humanize (_ → boşluk).
 */
const FIELD_LABELS: Record<string, string> = {
  // marka
  BRAND_NAME: "Marka adı",
  BRAND_VOICE: "Marka sesi / ton",
  PRODUCT_NAME: "Ürün adı",
  PRODUCT_CATEGORY: "Ürün kategorisi",
  KEY_FEATURE: "Öne çıkan özellik",
  BENEFIT: "Ana fayda",
  TARGET_AUDIENCE: "Hedef kitle",
  TONE: "Varsayılan ton",
  CTA: "Çağrı (CTA)",
  OFFER: "Teklif / kampanya",
  COLOR: "Marka rengi",
  INTERIOR_STYLE: "Stil",
  HASHTAG_COUNT: "Hashtag sayısı",
  WEBSITE: "Web sitesi",
  SOCIAL: "Sosyal hesap",
  // pack — mobilya (lowercase ham katalog alanı)
  color: "Renk",
  legs: "Ayak",
  style: "Stil",
  name: "Ürün adı",
  // derleyici (markadan) — vision'dan gelen özne
  SUBJECT: "Özne / konu (ne görünüyor)",
  AUDIENCE: "Hedef kitle",
  // pack — mobil oyun
  GAME_NAME: "Oyun adı",
  GAME_GENRE: "Tür",
  GAME_ART_STYLE: "Sanat stili",
  GAME_HERO: "Kahraman / özne",
  GAME_MOOD: "Ruh hali",
  GAME_HEADLINE: "Başlık",
}

const humanize = (key: string): string => {
  const s = key.replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Ham alan anahtarını insan-okunur etikete çevir. */
export const friendlyLabel = (key: string): string =>
  FIELD_LABELS[key] ?? humanize(key)

/** İçerik-tabanlı sayısal hash — profil değişince derleyici cache'i invalidate olsun. */
const profileVersion = (p: BrandProfile): number => {
  const s = JSON.stringify(profileValues(p))
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Düz brand-profile (BRAND_VARS) → BrandIdentity (derleyici girdisi). Geçici
 * köprü: gerçek BrandIdentity capture UI gelene kadar mevcut markayı adaptif
 * motora bağlar. `version` = içerik hash'i → marka değişince cache yenilenir.
 */
export const brandProfileToIdentity = (
  p: BrandProfile
): import("../../../hooks/api/content").BrandIdentity => ({
  id: "brand-profile",
  tenantId: "local",
  version: profileVersion(p),
  name: p.BRAND_NAME?.trim() || "Markan",
  domain: p.PRODUCT_CATEGORY?.trim() || "genel",
  offering: p.PRODUCT_NAME?.trim() || p.PRODUCT_CATEGORY?.trim() || "ürün",
  audience: p.TARGET_AUDIENCE?.trim() || "genel kitle",
  positioning: p.BENEFIT?.trim() || undefined,
  voice: { formality: 50, energy: 50, warmth: 50, complexity: 50 },
  visual: {
    colors: { primary: p.COLOR?.trim() || "brand color palette" },
    moodKeywords: [p.BRAND_VOICE, p.TONE].map((v) => v?.trim()).filter(Boolean) as string[],
  },
})
