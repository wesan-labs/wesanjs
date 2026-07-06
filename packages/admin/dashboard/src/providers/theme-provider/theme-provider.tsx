import { PropsWithChildren, useEffect, useState } from "react"
import {
  ThemeContext,
  ThemeOption,
  ThemeStyle,
  ThemeValue,
} from "./theme-context"

const THEME_KEY = "medusa_admin_theme"
const STYLE_KEY = "medusa_admin_theme_style"

function getDefaultTheme(): ThemeOption {
  const persisted = localStorage?.getItem(THEME_KEY) as ThemeOption
  return persisted || "system"
}

function getDefaultStyle(): ThemeStyle {
  const persisted = localStorage?.getItem(STYLE_KEY) as ThemeStyle
  return persisted || "default"
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

  const setTheme = (next: ThemeOption) => {
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
    setValue(getThemeValue(next))
  }

  const setStyle = (next: ThemeStyle) => {
    localStorage.setItem(STYLE_KEY, next)
    setStyleState(next)
  }

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
