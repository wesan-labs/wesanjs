/**
 * Output languages for generated content. The value IS the display name we send
 * to the model (and inject into the prompt library's {{LANGUAGE}} variable), so
 * Gemini outputs in that language. Extend freely — the model handles any.
 */
export const LANGUAGES = [
  "Türkçe",
  "English",
  "Deutsch",
  "Français",
  "Español",
  "Italiano",
  "Português",
  "Nederlands",
  "العربية",
  "Русский",
  "中文",
  "日本語",
] as const

export const DEFAULT_LANGUAGE = "Türkçe"
