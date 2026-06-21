export type ThemeTokens = Record<string, string>

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
   * Translucent styles (glassmorphism, aurora). When true the plugin adds a
   * fixed page backdrop (var(--app-backdrop)) and backdrop-filter blur on
   * Medusa surface utilities (cards/inputs) — backdrop-filter is a property,
   * not a variable, so the token bridge alone can't produce the frosted look.
   */
  frostedSurfaces?: boolean
}
