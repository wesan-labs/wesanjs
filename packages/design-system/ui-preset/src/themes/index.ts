import { tweakcnThemes } from "./tweakcn-index"
import type { ThemeDefinition } from "./types"

/**
 * Design-language theme registry. Each entry defines light + dark token sets.
 * Tweakcn themes are generated via `yarn generate:tweakcn`.
 */
export const themes = {
  ...tweakcnThemes,
} satisfies Record<string, ThemeDefinition>

export type ThemeName = keyof typeof themes

export type { ThemeDefinition, ThemeTokens } from "./types"
