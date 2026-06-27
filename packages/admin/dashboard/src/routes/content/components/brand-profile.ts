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
