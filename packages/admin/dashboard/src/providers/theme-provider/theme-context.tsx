import { createContext } from "react"

export type ThemeOption = "light" | "dark" | "system"
export type ThemeValue = "light" | "dark"

type ThemeStyleOption = {
  value: string
  label: string
}

export type ThemeStyleGroup = {
  label: string
  options: readonly ThemeStyleOption[]
}

/**
 * STYLE axis — design-language themes emitted by @medusajs/ui-preset under
 * [data-theme="<value>"] (+ .dark for the dark variant). "default" = stock
 * Medusa look (no data-theme). Independent of the light/dark MODE axis.
 */
export const THEME_STYLE_GROUPS = [
  {
    label: "Recommended",
    options: [
      { value: "default", label: "Default" },
      { value: "calm", label: "Calm UI" },
      { value: "bento", label: "Bento Box" },
      { value: "liquid-glass", label: "Liquid Glass" },
    ],
  },
  {
    label: "Premium",
    options: [{ value: "aurora", label: "Aurora UI" }],
  },
  {
    label: "Personality",
    options: [
      { value: "neubrutalism", label: "Neubrutalism" },
      { value: "cyberpunk", label: "Cyberpunk" },
    ],
  },
  {
    label: "Legacy / Niche",
    options: [
      { value: "glassmorphism", label: "Glassmorphism (legacy)" },
      { value: "neumorphism", label: "Neumorphism" },
      { value: "claymorphism", label: "Claymorphism" },
      { value: "brutalism", label: "Brutalism" },
    ],
  },
] as const satisfies readonly ThemeStyleGroup[]

export const THEME_STYLES = THEME_STYLE_GROUPS.flatMap((group) => group.options)

export type ThemeStyle = (typeof THEME_STYLES)[number]["value"]

type ThemeContextValue = {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
  style: ThemeStyle
  setStyle: (style: ThemeStyle) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
