#!/usr/bin/env node

/**
 * Fetch tweakcn registry themes and generate faithful Medusa theme modules.
 * Run: node scripts/generate-tweakcn-themes.mjs
 */

import { mkdir, writeFile, rm } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const outDir = resolve(root, "src/themes/tweakcn")
const rawDir = resolve(root, "src/themes/tweakcn-raw")

/** Curated for admin dashboards — professional first, a few expressive options. */
const CURATED_GROUPS = [
  {
    label: "Professional",
    slugs: ["modern-minimal", "graphite", "vercel", "claude"],
  },
  {
    label: "Expressive",
    slugs: ["catppuccin", "ocean-breeze", "midnight-bloom", "neo-brutalism"],
  },
]

const CURATED = CURATED_GROUPS.flatMap((group) => group.slugs)

const HARD_SURFACE_SLUGS = new Set([
  "neo-brutalism",
  "doom-64",
  "cyberpunk",
  "retro-arcade",
  "bold-tech",
])

const toExportId = (slug) =>
  slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

const toLabel = (title, slug) =>
  title ||
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

const pickRadius = (vars, themeMeta) =>
  vars.radius ?? themeMeta?.radius ?? "0.5rem"

const isHardRadius = (radius) => radius === "0" || radius === "0px"

const mapPalette = (vars, themeMeta, slug) => {
  const radius = pickRadius(vars, themeMeta)
  const hardBySlug = HARD_SURFACE_SLUGS.has(slug)
  const hardByRadius = isHardRadius(radius)
  const borderStyle = hardBySlug || hardByRadius ? "hard" : "soft"
  const borderWidth = borderStyle === "hard" ? "2px" : "1px"

  return {
    canvas: vars.background,
    canvasHover: vars.muted,
    canvasPressed: vars.secondary,
    surface: vars.card,
    surfaceHover: vars.secondary,
    surfacePressed: vars.muted,
    elevated: vars.popover,
    elevatedHover: vars.card,
    field: vars.muted,
    fieldHover: vars.secondary,
    text: vars.foreground,
    textMuted: vars["muted-foreground"],
    textSubtle: vars["muted-foreground"],
    accent: vars.primary,
    accentHover: vars.accent ?? vars.primary,
    accentFg: vars.primary,
    onAccent: vars["primary-foreground"],
    danger: vars.destructive,
    border: vars.border,
    borderStrong: vars.input ?? vars.border,
    borderStyle,
    radius,
    borderWidth,
    shadow: vars.shadow ?? vars["shadow-sm"] ?? "none",
    shadowSm: vars["shadow-sm"] ?? vars.shadow ?? "none",
    shadowMd: vars["shadow-md"] ?? vars["shadow-sm"] ?? "none",
    shadowLg: vars["shadow-lg"] ?? vars["shadow-md"] ?? "none",
    shadowPressed: vars["shadow-xs"] ?? vars["shadow-2xs"] ?? "none",
    blur: vars["shadow-blur"] ?? "3px",
    glow: "none",
    focusRing: `3px solid ${vars.ring}`,
    focusRingOffset: "2px",
    tags: mapTags(vars),
  }
}

const mapTags = (vars) => ({
  neutral: {
    bg: vars.muted,
    bgHover: vars.secondary,
    text: vars["muted-foreground"],
    border: vars.border,
    icon: vars["muted-foreground"],
  },
  red: {
    bg: vars.destructive,
    bgHover: vars["chart-5"] ?? vars.destructive,
    text: vars["destructive-foreground"],
    border: vars.destructive,
    icon: vars.destructive,
  },
  blue: {
    bg: vars["chart-3"] ?? vars.accent,
    bgHover: vars["chart-2"] ?? vars.accent,
    text: vars["accent-foreground"],
    border: vars["chart-3"] ?? vars.accent,
    icon: vars["chart-3"] ?? vars.accent,
  },
  green: {
    bg: vars["chart-2"] ?? vars.secondary,
    bgHover: vars["chart-4"] ?? vars.secondary,
    text: vars["secondary-foreground"],
    border: vars["chart-2"] ?? vars.secondary,
    icon: vars["chart-2"] ?? vars.secondary,
  },
  orange: {
    bg: vars["chart-4"] ?? vars.accent,
    bgHover: vars["chart-1"] ?? vars.accent,
    text: vars["accent-foreground"],
    border: vars["chart-4"] ?? vars.accent,
    icon: vars["chart-4"] ?? vars.accent,
  },
  purple: {
    bg: vars["chart-5"] ?? vars.accent,
    bgHover: vars["chart-1"] ?? vars.accent,
    text: vars["accent-foreground"],
    border: vars["chart-5"] ?? vars.accent,
    icon: vars["chart-5"] ?? vars.accent,
  },
})

/** Preserve full shadcn variable contract + chrome sidebar mapping. */
const mapExtra = (vars) => {
  const extra = {}

  for (const [key, value] of Object.entries(vars)) {
    extra[`--${key}`] = value
  }

  if (vars.sidebar) {
    extra["--chrome-bg"] = vars.sidebar
    extra["--chrome-bg-hover"] = vars["sidebar-accent"] ?? vars.sidebar
    extra["--chrome-bg-pressed"] = vars["sidebar-primary"] ?? vars.sidebar
    extra["--chrome-border"] = vars["sidebar-border"] ?? vars.border
    extra["--chrome-fg"] = vars["sidebar-foreground"] ?? vars.foreground
  }

  if (vars["font-sans"]) {
    extra["--font-sans-theme"] = vars["font-sans"]
  }

  if (vars["font-mono"]) {
    extra["--font-mono-theme"] = vars["font-mono"]
  }

  return extra
}

const serialize = (value, indent = 0) => {
  const pad = "  ".repeat(indent)
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => serialize(v, indent + 1)).join(", ")}]`
  }
  const entries = Object.entries(value)
  if (!entries.length) return "{}"
  const inner = entries
    .map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${serialize(v, indent + 1)}`)
    .join(",\n")
  return `{\n${inner}\n${pad}}`
}

const generateThemeFile = (item) => {
  const slug = item.name
  const exportId = toExportId(slug)
  const label = toLabel(item.title, slug)
  const themeMeta = item.cssVars?.theme ?? {}
  const lightVars = item.cssVars?.light ?? {}
  const darkVars = item.cssVars?.dark ?? {}
  const hardSurface = HARD_SURFACE_SLUGS.has(slug)

  const lightPalette = mapPalette(lightVars, themeMeta, slug)
  const darkPalette = mapPalette(darkVars, themeMeta, slug)
  const lightExtra = mapExtra(lightVars)
  const darkExtra = mapExtra(darkVars)

  return `import { defineTheme } from "../build-tokens"

/** Auto-generated from tweakcn — do not edit by hand. Run generate-tweakcn-themes.mjs */
export const ${exportId} = defineTheme({
  name: ${JSON.stringify(slug)},
  label: ${JSON.stringify(label)},
  faithfulSource: "tweakcn",
${hardSurface ? "  hardSurface: true,\n" : ""}  light: {
    palette: ${serialize(lightPalette, 2)},
    extra: ${serialize(lightExtra, 2)},
  },
  dark: {
    palette: ${serialize(darkPalette, 2)},
    extra: ${serialize(darkExtra, 2)},
  },
})
`
}

const registryRes = await fetch("https://tweakcn.com/r/registry.json")
if (!registryRes.ok) {
  console.error("failed to fetch registry", registryRes.status)
  process.exit(1)
}

const registry = await registryRes.json()
const byName = new Map(registry.items.map((item) => [item.name, item]))

await mkdir(rawDir, { recursive: true })
await mkdir(outDir, { recursive: true })

const generated = []

for (const slug of CURATED) {
  const item = byName.get(slug)
  if (!item) {
    console.error(`missing theme in registry: ${slug}`)
    process.exitCode = 1
    continue
  }

  await writeFile(
    resolve(rawDir, `${slug}.json`),
    `${JSON.stringify(item, null, 2)}\n`
  )

  const exportId = toExportId(slug)
  const filePath = resolve(outDir, `${slug}.ts`)
  await writeFile(filePath, generateThemeFile(item))
  generated.push({ slug, exportId, label: toLabel(item.title, slug) })
  console.log(`generated ${slug}.ts`)
}

const indexContent = `${generated
  .map(
    ({ slug, exportId }) =>
      `import { ${exportId} } from "./tweakcn/${slug}"`
  )
  .join("\n")}

/**
 * Tweakcn themes — auto-generated. Regenerate: yarn generate:tweakcn
 */
export const tweakcnThemes = {
${generated.map(({ exportId }) => `  ${exportId},`).join("\n")}
} satisfies Record<string, import("./types").ThemeDefinition>
`

await writeFile(resolve(root, "src/themes/tweakcn-index.ts"), indexContent)

const pickerContent = `/**
 * Theme picker metadata — auto-generated. Regenerate: yarn generate:tweakcn
 */
export type ThemeStyleOption = {
  value: string
  label: string
}

export type ThemeStyleGroup = {
  label: string
  options: readonly ThemeStyleOption[]
}

export const THEME_STYLE_GROUPS: readonly ThemeStyleGroup[] = [
  {
    label: "Professional",
    options: [
      { value: "default", label: "Default" },
${CURATED_GROUPS[0].slugs
  .map((slug) => {
    const item = byName.get(slug)
    const label = toLabel(item?.title, slug)
    return `      { value: ${JSON.stringify(slug)}, label: ${JSON.stringify(label)} },`
  })
  .join("\n")}
    ],
  },
  {
    label: "Expressive",
    options: [
${CURATED_GROUPS[1].slugs
  .map((slug) => {
    const item = byName.get(slug)
    const label = toLabel(item?.title, slug)
    return `      { value: ${JSON.stringify(slug)}, label: ${JSON.stringify(label)} },`
  })
  .join("\n")}
    ],
  },
]

export const THEME_STYLES: readonly ThemeStyleOption[] = THEME_STYLE_GROUPS.flatMap(
  (group) => group.options
)

export type ThemeStyle =
  | "default"
${CURATED.map((slug) => `  | ${JSON.stringify(slug)}`).join("\n")}
`

await writeFile(resolve(root, "src/themes/theme-picker.ts"), pickerContent)

console.log(`\nWrote ${generated.length} themes → src/themes/tweakcn/`)
console.log("Wrote theme-picker.ts")
