import type { ThemeDefinition, ThemeTokens } from "./types"

/** Semantic palette → full Medusa UI token contract. */
export type ThemePalette = {
  canvas: string
  canvasHover?: string
  canvasPressed?: string
  surface: string
  surfaceHover?: string
  surfacePressed?: string
  elevated: string
  elevatedHover?: string
  elevatedPressed?: string
  field: string
  fieldHover?: string
  fieldSurface?: string
  fieldSurfaceHover?: string
  text: string
  textMuted: string
  textSubtle: string
  textDisabled?: string
  accent: string
  accentHover?: string
  accentFg?: string
  onAccent: string
  danger?: string
  dangerHover?: string
  onDanger?: string
  border: string
  borderStrong: string
  borderInteractive?: string
  highlight?: string
  highlightHover?: string
  switchOff?: string
  switchOffHover?: string
  overlay?: string
  contrastBg?: string
  contrastBgHover?: string
  contrastFg?: string
  contrastFgMuted?: string
  contrastBorder?: string
  radius: string
  borderWidth: string
  shadow: string
  shadowPressed: string
  blur: string
  glow: string
  /** How Medusa shadow-borders-* utilities render. */
  borderStyle?: "default" | "hard" | "soft" | "none"
  tags?: Partial<
    Record<
      "neutral" | "red" | "blue" | "green" | "orange" | "purple",
      { bg: string; bgHover: string; text: string; border: string; icon: string }
    >
  >
}

const DEFAULT_TAGS_LIGHT = {
  neutral: {
    bg: "#f4f4f5",
    bgHover: "#e4e4e7",
    text: "#52525b",
    border: "#e4e4e7",
    icon: "#a1a1aa",
  },
  red: {
    bg: "#ffe4e6",
    bgHover: "#fecdd3",
    text: "#9f1239",
    border: "#fecdd3",
    icon: "#f43f5e",
  },
  blue: {
    bg: "#dbeafe",
    bgHover: "#bfdbfe",
    text: "#1e40af",
    border: "#bfdbfe",
    icon: "#3b82f6",
  },
  green: {
    bg: "#d1fae5",
    bgHover: "#a7f3d0",
    text: "#065f46",
    border: "#a7f3d0",
    icon: "#10b981",
  },
  orange: {
    bg: "#ffedd5",
    bgHover: "#fed7aa",
    text: "#9a3412",
    border: "#fed7aa",
    icon: "#f97316",
  },
  purple: {
    bg: "#ede9fe",
    bgHover: "#ddd6fe",
    text: "#5b21b6",
    border: "#ddd6fe",
    icon: "#8b5cf6",
  },
} as const

const DEFAULT_TAGS_DARK = {
  neutral: {
    bg: "rgba(255,255,255,0.08)",
    bgHover: "rgba(255,255,255,0.12)",
    text: "#d4d4d8",
    border: "rgba(255,255,255,0.06)",
    icon: "#71717a",
  },
  red: {
    bg: "rgba(190,18,60,0.2)",
    bgHover: "rgba(190,18,60,0.28)",
    text: "#fda4af",
    border: "rgba(190,18,60,0.35)",
    icon: "#fb7185",
  },
  blue: {
    bg: "rgba(30,58,138,0.35)",
    bgHover: "rgba(30,58,138,0.45)",
    text: "#93c5fd",
    border: "rgba(30,58,138,0.5)",
    icon: "#60a5fa",
  },
  green: {
    bg: "rgba(6,78,59,0.35)",
    bgHover: "rgba(6,78,59,0.45)",
    text: "#6ee7b7",
    border: "rgba(6,78,59,0.5)",
    icon: "#34d399",
  },
  orange: {
    bg: "rgba(124,45,18,0.35)",
    bgHover: "rgba(124,45,18,0.45)",
    text: "#fdba74",
    border: "rgba(124,45,18,0.5)",
    icon: "#fb923c",
  },
  purple: {
    bg: "rgba(91,33,182,0.35)",
    bgHover: "rgba(91,33,182,0.45)",
    text: "#c4b5fd",
    border: "rgba(91,33,182,0.5)",
    icon: "#a78bfa",
  },
} as const

const borderEffect = (p: ThemePalette): string => {
  const w = p.borderWidth
  if (p.borderStyle === "none" || w === "0" || w === "0px") {
    return "none"
  }
  if (p.borderStyle === "hard") {
    return `${w} ${w} 0 0 ${p.borderStrong}`
  }
  if (p.borderStyle === "soft") {
    return `0 0 0 ${w} ${p.border}`
  }
  return `0 0 0 ${w} ${p.border}`
}

const buttonShadow = (p: ThemePalette): string => {
  if (p.borderStyle === "hard") {
    return `${p.borderWidth} ${p.borderWidth} 0 0 ${p.borderStrong}`
  }
  if (p.shadow === "none") {
    return borderEffect(p)
  }
  return p.shadow
}

/** Expand semantic palette into the full Medusa CSS variable set. */
export const buildMedusaTokens = (
  p: ThemePalette,
  mode: "light" | "dark"
): ThemeTokens => {
  const tags = {
    ...(mode === "light" ? DEFAULT_TAGS_LIGHT : DEFAULT_TAGS_DARK),
    ...p.tags,
  }

  const canvasHover = p.canvasHover ?? p.surface
  const canvasPressed = p.canvasPressed ?? canvasHover
  const surfaceHover = p.surfaceHover ?? p.elevated
  const surfacePressed = p.surfacePressed ?? surfaceHover
  const elevatedHover = p.elevatedHover ?? surfaceHover
  const elevatedPressed = p.elevatedPressed ?? elevatedHover
  const fieldHover = p.fieldHover ?? p.elevated
  const fieldSurface = p.fieldSurface ?? p.surface
  const fieldSurfaceHover = p.fieldSurfaceHover ?? surfaceHover
  const accentHover = p.accentHover ?? p.accent
  const accentFg = p.accentFg ?? p.accent
  const danger = p.danger ?? (mode === "light" ? "#e11d48" : "#fb7185")
  const dangerHover = p.dangerHover ?? danger
  const onDanger = p.onDanger ?? "#ffffff"
  const borderInteractive = p.borderInteractive ?? p.accent
  const highlight = p.highlight ?? `${p.accent}18`
  const highlightHover = p.highlightHover ?? `${p.accent}28`
  const switchOff = p.switchOff ?? p.border
  const switchOffHover = p.switchOffHover ?? p.textMuted
  const overlay = p.overlay ?? (mode === "light" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.72)")
  const contrastBg = p.contrastBg ?? p.text
  const contrastBgHover = p.contrastBgHover ?? p.textMuted
  const contrastFg = p.contrastFg ?? p.surface
  const contrastFgMuted = p.contrastFgMuted ?? `${contrastFg}8f`
  const contrastBorder = p.contrastBorder ?? p.border
  const textDisabled = p.textDisabled ?? p.textSubtle
  const borders = borderEffect(p)
  const btnShadow = buttonShadow(p)
  const flyoutShadow = p.shadow === "none" ? borders : p.shadow

  return {
    "--bg-subtle": p.canvas,
    "--bg-subtle-hover": canvasHover,
    "--bg-subtle-pressed": canvasPressed,
    "--bg-base": p.surface,
    "--bg-base-hover": surfaceHover,
    "--bg-base-pressed": surfacePressed,
    "--bg-component": p.elevated,
    "--bg-component-hover": elevatedHover,
    "--bg-component-pressed": elevatedPressed,
    "--bg-field": p.field,
    "--bg-field-hover": fieldHover,
    "--bg-field-component": fieldSurface,
    "--bg-field-component-hover": fieldSurfaceHover,
    "--bg-switch-off": switchOff,
    "--bg-switch-off-hover": switchOffHover,
    "--bg-highlight": highlight,
    "--bg-highlight-hover": highlightHover,
    "--bg-interactive": p.accent,
    "--bg-disabled": p.elevated,
    "--bg-overlay": overlay,
    "--border-base": p.border,
    "--border-strong": p.borderStrong,
    "--border-interactive": borderInteractive,
    "--border-danger": danger,
    "--border-error": danger,
    "--border-transparent": "transparent",
    "--border-menu-top": p.border,
    "--border-menu-bot": p.surface,
    "--fg-base": p.text,
    "--fg-subtle": p.textSubtle,
    "--fg-muted": p.textMuted,
    "--fg-disabled": textDisabled,
    "--fg-on-color": p.onAccent,
    "--fg-on-inverted": p.onAccent,
    "--fg-interactive": accentFg,
    "--fg-interactive-hover": accentHover,
    "--fg-error": danger,
    "--button-neutral": p.elevated,
    "--button-neutral-hover": elevatedHover,
    "--button-neutral-pressed": elevatedPressed,
    "--button-inverted": p.accent,
    "--button-inverted-hover": accentHover,
    "--button-inverted-pressed": accentHover,
    "--button-danger": danger,
    "--button-danger-hover": dangerHover,
    "--button-danger-pressed": dangerHover,
    "--button-transparent": "transparent",
    "--button-transparent-hover": highlight,
    "--button-transparent-pressed": highlightHover,
    "--contrast-bg-base": contrastBg,
    "--contrast-bg-base-hover": contrastBgHover,
    "--contrast-bg-base-pressed": contrastBgHover,
    "--contrast-bg-subtle": highlight,
    "--contrast-fg-primary": contrastFg,
    "--contrast-fg-secondary": contrastFgMuted,
    "--contrast-border-base": contrastBorder,
    "--contrast-border-top": contrastBg,
    "--contrast-border-bot": p.border,
    "--tag-neutral-bg": tags.neutral!.bg,
    "--tag-neutral-bg-hover": tags.neutral!.bgHover,
    "--tag-neutral-text": tags.neutral!.text,
    "--tag-neutral-border": tags.neutral!.border,
    "--tag-neutral-icon": tags.neutral!.icon,
    "--tag-red-bg": tags.red!.bg,
    "--tag-red-bg-hover": tags.red!.bgHover,
    "--tag-red-text": tags.red!.text,
    "--tag-red-border": tags.red!.border,
    "--tag-red-icon": tags.red!.icon,
    "--tag-blue-bg": tags.blue!.bg,
    "--tag-blue-bg-hover": tags.blue!.bgHover,
    "--tag-blue-text": tags.blue!.text,
    "--tag-blue-border": tags.blue!.border,
    "--tag-blue-icon": tags.blue!.icon,
    "--tag-green-bg": tags.green!.bg,
    "--tag-green-bg-hover": tags.green!.bgHover,
    "--tag-green-text": tags.green!.text,
    "--tag-green-border": tags.green!.border,
    "--tag-green-icon": tags.green!.icon,
    "--tag-orange-bg": tags.orange!.bg,
    "--tag-orange-bg-hover": tags.orange!.bgHover,
    "--tag-orange-text": tags.orange!.text,
    "--tag-orange-border": tags.orange!.border,
    "--tag-orange-icon": tags.orange!.icon,
    "--tag-purple-bg": tags.purple!.bg,
    "--tag-purple-bg-hover": tags.purple!.bgHover,
    "--tag-purple-text": tags.purple!.text,
    "--tag-purple-border": tags.purple!.border,
    "--tag-purple-icon": tags.purple!.icon,
    "--alpha-250": mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
    "--alpha-400": mode === "light" ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.24)",
    "--background": p.canvas,
    "--surface": p.surface,
    "--primary": p.accent,
    "--secondary": p.textMuted,
    "--text": p.text,
    "--border": p.border,
    "--radius": p.radius,
    "--border-width": p.borderWidth,
    "--shadow": p.shadow,
    "--shadow-pressed": p.shadowPressed,
    "--blur": p.blur,
    "--glow": p.glow,
    "--opacity-surface": "1",
    "--elevation-card-rest": flyoutShadow,
    "--elevation-card-hover": flyoutShadow,
    "--elevation-flyout": flyoutShadow,
    "--elevation-modal": flyoutShadow,
    "--elevation-tooltip": flyoutShadow,
    "--elevation-code-block": flyoutShadow,
    "--borders-base": borders,
    "--buttons-neutral": btnShadow,
    "--buttons-inverted": btnShadow,
  }
}

type DefineThemeOpts = {
  name: string
  label: string
  frostedSurfaces?: boolean
  hardSurface?: boolean
  light: { palette: ThemePalette; extra?: ThemeTokens }
  dark: { palette: ThemePalette; extra?: ThemeTokens }
}

export const defineTheme = (opts: DefineThemeOpts): ThemeDefinition => ({
  name: opts.name,
  label: opts.label,
  frostedSurfaces: opts.frostedSurfaces,
  hardSurface: opts.hardSurface,
  light: {
    ...buildMedusaTokens(opts.light.palette, "light"),
    ...opts.light.extra,
  },
  dark: {
    ...buildMedusaTokens(opts.dark.palette, "dark"),
    ...opts.dark.extra,
  },
})
