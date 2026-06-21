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
}
