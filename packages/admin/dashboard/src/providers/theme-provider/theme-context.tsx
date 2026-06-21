import { createContext } from "react"

export type ThemeOption = "light" | "dark" | "system"
export type ThemeValue = "light" | "dark"

/**
 * STYLE axis — design-language themes emitted by @medusajs/ui-preset under
 * [data-theme="<value>"] (+ .dark for the dark variant). "default" = stock
 * Medusa look (no data-theme). Independent of the light/dark MODE axis.
 */
export const THEME_STYLES = [
  { value: "default", label: "Default" },
  { value: "neumorphism", label: "Neumorphism" },
  { value: "glassmorphism", label: "Glassmorphism" },
  { value: "brutalism", label: "Brutalism" },
  { value: "bento", label: "Bento Box" },
  { value: "neubrutalism", label: "Neubrutalism" },
  { value: "aurora", label: "Aurora UI" },
  { value: "claymorphism", label: "Claymorphism" },
  { value: "calm", label: "Calm UI" },
  { value: "cyberpunk", label: "Cyberpunk" },
] as const

export type ThemeStyle = (typeof THEME_STYLES)[number]["value"]

type ThemeContextValue = {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
  style: ThemeStyle
  setStyle: (style: ThemeStyle) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
