/**
 * Loads web fonts referenced by tweakcn themes.
 * Inter/Roboto Mono are bundled in index.css; others are fetched on demand.
 */
const GOOGLE_FAMILIES: Record<string, string> = {
  Montserrat: "Montserrat:wght@400;500;600;700",
  "DM Sans": "DM+Sans:wght@400;500;600;700",
}

const GEIST_STYLESHEET =
  "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/400.css"

const loaded = new Set<string>()

const ensureStylesheet = (id: string, href: string) => {
  if (loaded.has(id) || document.getElementById(id)) {
    loaded.add(id)
    return
  }

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
  loaded.add(id)
}

export const loadThemeFont = (fontFamilyValue: string | undefined) => {
  if (!fontFamilyValue) {
    return
  }

  const primary = fontFamilyValue.split(",")[0]?.trim().replace(/^["']|["']$/g, "")
  if (!primary || primary === "Inter" || primary === "ui-sans-serif") {
    return
  }

  if (primary === "Geist") {
    ensureStylesheet("theme-font-geist", GEIST_STYLESHEET)
    return
  }

  const googleQuery = GOOGLE_FAMILIES[primary]
  if (googleQuery) {
    ensureStylesheet(
      `theme-font-${primary.toLowerCase().replace(/\s+/g, "-")}`,
      `https://fonts.googleapis.com/css2?family=${googleQuery}&display=swap`
    )
  }
}
