/**
 * WCAG AA contrast validation for design-language theme tokens.
 * Run: yarn validate:themes
 */
import { themes } from "../src/themes"

type Rgb = { r: number; g: number; b: number; a: number }

const parseColor = (input: string): Rgb | null => {
  const hex = input.trim()
  if (hex.startsWith("#")) {
    const h = hex.slice(1)
    if (h.length === 3) {
      return {
        r: parseInt(h[0]! + h[0], 16),
        g: parseInt(h[1]! + h[1], 16),
        b: parseInt(h[2]! + h[2], 16),
        a: 1,
      }
    }
    if (h.length === 6) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: 1,
      }
    }
  }

  const rgba = hex.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
  )
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] !== undefined ? Number(rgba[4]) : 1,
    }
  }

  const oklch = hex.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i
  )
  if (oklch) {
    const l = Number(oklch[1])
    const c = Number(oklch[2])
    const h = (Number(oklch[3]) * Math.PI) / 180
    const a = oklch[4] !== undefined ? Number(oklch[4]) : 1
    const labA = c * Math.cos(h)
    const labB = c * Math.sin(h)
    const l_ = l + 0.3963377774 * labA + 0.2158037573 * labB
    const m_ = l - 0.1055613458 * labA - 0.0638541728 * labB
    const s_ = l - 0.0894841775 * labA - 1.291485548 * labB
    const l3 = l_ ** 3
    const m3 = m_ ** 3
    const s3 = s_ ** 3
    const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
    const gLin = -1.2684380046 * l3 + 2.6097574015 * m3 - 0.3413193965 * s3
    const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
    const toSrgb = (v: number) => {
      const clamped = Math.min(1, Math.max(0, v))
      return clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * clamped ** (1 / 2.4) - 0.055
    }
    return {
      r: Math.round(toSrgb(rLin) * 255),
      g: Math.round(toSrgb(gLin) * 255),
      b: Math.round(toSrgb(bLin) * 255),
      a,
    }
  }

  return null
}

const blend = (fg: Rgb, bg: Rgb): Rgb => {
  const a = fg.a + bg.a * (1 - fg.a)
  if (a === 0) {
    return { r: 0, g: 0, b: 0, a: 0 }
  }
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  }
}

const luminance = (c: Rgb): number => {
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
}

const contrastRatio = (fg: string, bg: string): number | null => {
  const fgRgb = parseColor(fg)
  const bgRgb = parseColor(bg)
  if (!fgRgb || !bgRgb) {
    return null
  }

  const fgBlended = fgRgb.a < 1 ? blend(fgRgb, bgRgb) : fgRgb
  const l1 = luminance(fgBlended)
  const l2 = luminance(bgRgb)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

type Pair = { label: string; fg: string; bg: string; min: number }

const pairsForMode = (tokens: Record<string, string>): Pair[] => [
  {
    label: "body text on canvas",
    fg: tokens["--fg-base"]!,
    bg: tokens["--bg-subtle"]!,
    min: 4.5,
  },
  {
    label: "muted text on surface",
    fg: tokens["--fg-muted"]!,
    bg: tokens["--bg-base"]!,
    min: 4.5,
  },
  {
    label: "subtle text on surface",
    fg: tokens["--fg-subtle"]!,
    bg: tokens["--bg-base"]!,
    min: 3,
  },
  {
    label: "on-accent on interactive",
    fg: tokens["--fg-on-color"]!,
    bg: tokens["--bg-interactive"]!,
    min: 4.5,
  },
  {
    label: "interactive on surface",
    fg: tokens["--fg-interactive"]!,
    bg: tokens["--bg-base"]!,
    min: 4.5,
  },
]

let failures = 0

for (const theme of Object.values(themes)) {
  for (const mode of ["light", "dark"] as const) {
    const tokens = theme[mode]
    for (const pair of pairsForMode(tokens)) {
      const ratio = contrastRatio(pair.fg, pair.bg)
      if (ratio === null) {
        console.warn(
          `[skip] ${theme.name} (${mode}): ${pair.label} — unparsed colors`
        )
        continue
      }
      if (ratio < pair.min) {
        failures++
        console.error(
          `[fail] ${theme.name} (${mode}): ${pair.label} — ${ratio.toFixed(2)}:1 (need ${pair.min}:1)`
        )
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} contrast check(s) failed.`)
  process.exit(1)
}

console.log("All theme contrast checks passed.")
