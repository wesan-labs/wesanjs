export type ThemeTokens = Record<string, string>

export type ThemeMaterial = "opaque" | "frosted" | "liquid"
export type GlassVariant = "regular" | "clear"
export type GlassScope = "all" | "chrome"
export type ThemeIntensity = "archive" | "operator" | "combat"

export type ThemeDefinition = {
  /** data-theme attribute value, e.g. <html data-theme="cyberpunk"> */
  name: string
  /** Human-readable label for theme pickers. */
  label: string
  /** Tokens emitted for [data-theme="name"] — applied in light mode. */
  light: ThemeTokens
  /** Tokens emitted for [data-theme="name"].dark — applied in dark mode (higher specificity wins). */
  dark: ThemeTokens
  /**
   * Surface material pipeline. `frosted` / `liquid` enable backdrop compositing.
   * @deprecated Use `material` — `frostedSurfaces: true` maps to `material: "frosted"`.
   */
  frostedSurfaces?: boolean
  /** Surface material: opaque (default), frosted blur, or liquid glass specular stack. */
  material?: ThemeMaterial
  /** Liquid glass: specular rim, elevation blur ladder, scrim. */
  liquidGlass?: boolean
  /** Liquid glass variant — admin defaults to regular (adaptive legibility). */
  glassVariant?: GlassVariant
  /** Where backdrop-filter applies: all surfaces or chrome-only (nav/modals). */
  glassScope?: GlassScope
  /** Neon/cyberpunk intensity dial (Phase 2). */
  intensity?: ThemeIntensity
  /** Brutalist / neubrutalist: hard border + offset shadow on card surfaces. */
  hardSurface?: boolean
  /** Imported from tweakcn — contrast may follow shadcn palette, not Medusa AA targets. */
  faithfulSource?: "tweakcn"
}

/** Resolved material for plugin pipeline (backward-compat shim). */
export const resolveMaterial = (theme: ThemeDefinition): ThemeMaterial => {
  if (theme.material) {
    return theme.material
  }
  if (theme.frostedSurfaces) {
    return theme.liquidGlass ? "liquid" : "frosted"
  }
  return "opaque"
}

export const resolveGlassScope = (theme: ThemeDefinition): GlassScope => {
  return theme.glassScope ?? (theme.liquidGlass ? "chrome" : "all")
}
