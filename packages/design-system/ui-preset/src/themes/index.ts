import { aurora } from "./aurora"
import { bento } from "./bento"
import { brutalism } from "./brutalism"
import { calm } from "./calm"
import { claymorphism } from "./claymorphism"
import { cyberpunk } from "./cyberpunk"
import { glassmorphism } from "./glassmorphism"
import { liquidGlass } from "./liquid-glass"
import { neubrutalism } from "./neubrutalism"
import { neumorphism } from "./neumorphism"
import type { ThemeDefinition } from "./types"

/**
 * Design-language theme registry. Each entry defines light + dark token sets.
 * light/dark MODE (the .dark class) stays in tokens/colors.ts + tokens/effects.ts.
 * STYLE is emitted by plugin.ts under [data-theme="<name>"] (light) and
 * [data-theme="<name>"].dark (dark). The two axes are independent.
 */
export const themes = {
  calm,
  bento,
  liquidGlass,
  aurora,
  glassmorphism,
  neubrutalism,
  cyberpunk,
  neumorphism,
  brutalism,
  claymorphism,
} satisfies Record<string, ThemeDefinition>

export type ThemeName = keyof typeof themes

export type { ThemeDefinition, ThemeTokens } from "./types"
