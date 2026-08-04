import { themes, type ThemeDefinition, type ThemeName } from "./themes"
import type { ThemeTokens } from "./themes/types"

const themesByName = Object.values(themes).reduce<
  Record<string, ThemeDefinition>
>((acc, theme) => {
  acc[theme.name] = theme
  return acc
}, {})

export const getThemeTokens = (
  style: string,
  mode: "light" | "dark"
): ThemeTokens | null => {
  if (!style || style === "default") {
    return null
  }

  const theme = themesByName[style]
  if (!theme) {
    return null
  }

  return mode === "dark" ? theme.dark : theme.light
}

export const listThemeTokenKeys = (tokens: ThemeTokens): string[] =>
  Object.keys(tokens).filter((key) => key.startsWith("--"))

export const applyThemeTokens = (
  element: HTMLElement,
  tokens: ThemeTokens
): string[] => {
  const keys = listThemeTokenKeys(tokens)

  for (const key of keys) {
    const value = tokens[key as keyof ThemeTokens]
    if (typeof value === "string") {
      element.style.setProperty(key, value)
    }
  }

  return keys
}

export const clearThemeTokens = (element: HTMLElement, keys: string[]) => {
  for (const key of keys) {
    element.style.removeProperty(key)
  }
}

export {
  THEME_STYLE_GROUPS,
  THEME_STYLES,
  type ThemeStyle,
} from "./themes/theme-picker"

export { themes, type ThemeName }
