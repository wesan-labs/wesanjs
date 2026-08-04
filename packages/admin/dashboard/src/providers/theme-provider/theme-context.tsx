export {
  THEME_STYLE_GROUPS,
  THEME_STYLES,
  type ThemeStyle,
} from "@medusajs/ui-preset/runtime"

import { createContext } from "react"
import type { ThemeStyle } from "@medusajs/ui-preset/runtime"

export type ThemeOption = "light" | "dark" | "system"
export type ThemeValue = "light" | "dark"

type ThemeContextValue = {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
  style: ThemeStyle
  setStyle: (style: ThemeStyle) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
