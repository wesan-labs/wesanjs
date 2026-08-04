import { PropsWithChildren, useEffect, useRef, useState } from "react"
import {
  applyThemeTokens,
  clearThemeTokens,
  getThemeTokens,
  THEME_STYLES,
} from "@medusajs/ui-preset/runtime"
import {
  ThemeContext,
  ThemeOption,
  ThemeStyle,
  ThemeValue,
} from "./theme-context"
import { loadThemeFont } from "./load-theme-font"

const THEME_KEY = "medusa_admin_theme"
const STYLE_KEY = "medusa_admin_theme_style"

function getDefaultTheme(): ThemeOption {
  const persisted = localStorage?.getItem(THEME_KEY) as ThemeOption
  return persisted || "system"
}

function getDefaultStyle(): ThemeStyle {
  const persisted = localStorage?.getItem(STYLE_KEY) as ThemeStyle
  if (!persisted) {
    return "default"
  }

  const isKnownStyle = THEME_STYLES.some((option) => option.value === persisted)
  return isKnownStyle ? persisted : "default"
}

function getThemeValue(selected: ThemeOption): ThemeValue {
  if (selected === "system") {
    if (window !== undefined) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    // Default to light theme if we can't detect the system preference
    return "light"
  }

  return selected
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  // MODE axis: light / dark / system
  const [theme, setThemeState] = useState<ThemeOption>(getDefaultTheme())
  const [value, setValue] = useState<ThemeValue>(getThemeValue(getDefaultTheme()))
  // STYLE axis: default + design-language themes (data-theme)
  const [style, setStyleState] = useState<ThemeStyle>(getDefaultStyle())
  const appliedTokenKeysRef = useRef<string[]>([])

  const setTheme = (next: ThemeOption) => {
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
    setValue(getThemeValue(next))
  }

  const setStyle = (next: ThemeStyle) => {
    const isKnownStyle = THEME_STYLES.some((option) => option.value === next)
    const safeStyle = isKnownStyle ? next : "default"
    localStorage.setItem(STYLE_KEY, safeStyle)
    setStyleState(safeStyle)
  }

  // Keep MODE axis in sync when the user picks "system" and OS preference changes.
  useEffect(() => {
    if (theme !== "system") {
      return
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setValue(media.matches ? "dark" : "light")

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  useEffect(() => {
    const html = document.documentElement

    /**
     * Temporarily disable transitions to prevent
     * the theme change from flashing.
     */
    const css = document.createElement("style")
    css.appendChild(
      document.createTextNode(
        `* {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -o-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
          }`
      )
    )
    document.head.appendChild(css)

    // MODE axis -> .dark/.light class (base tokens + class-based checks, e.g. data-grid)
    html.classList.remove(value === "light" ? "dark" : "light")
    html.classList.add(value)
    // Ensures that native elements respect the theme, e.g. the scrollbar.
    html.style.colorScheme = value

    // STYLE axis -> data-theme attribute (design-language token overlay).
    // Combined with .dark above, [data-theme].dark supplies the dark variant.
    if (style && style !== "default") {
      html.setAttribute("data-theme", style)
    } else {
      html.removeAttribute("data-theme")
    }

    if (style === "cyberpunk") {
      html.setAttribute("data-theme-intensity", "operator")
    } else {
      html.removeAttribute("data-theme-intensity")
    }

    clearThemeTokens(html, appliedTokenKeysRef.current)
    appliedTokenKeysRef.current = []

    const tokens = getThemeTokens(style, value)
    if (tokens) {
      appliedTokenKeysRef.current = applyThemeTokens(html, tokens)
      const fontSans = tokens["--font-sans-theme"] ?? tokens["--font-sans"]
      if (typeof fontSans === "string") {
        loadThemeFont(fontSans)
        html.style.fontFamily = fontSans
      }
    } else {
      html.style.removeProperty("font-family")
    }

    /**
     * Re-enable transitions after the theme has been set,
     * and force the browser to repaint.
     */
    window.getComputedStyle(css).opacity
    document.head.removeChild(css)
  }, [value, style])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, style, setStyle }}>
      {children}
    </ThemeContext.Provider>
  )
}
