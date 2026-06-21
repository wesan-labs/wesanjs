import plugin from "tailwindcss/plugin"
import { FONT_FAMILY_MONO, FONT_FAMILY_SANS } from "./constants"
import { theme } from "./theme/extension/theme"
import { colors } from "./theme/tokens/colors"
import { components } from "./theme/tokens/components"
import { effects } from "./theme/tokens/effects"
import { typography } from "./theme/tokens/typography"
import { themes } from "./themes"

export default plugin(
  function medusaUi({ addBase, addComponents, config }) {
    const [darkMode, className = ".dark"] = ([] as string[]).concat(
      config("darkMode", "media")
    )

    addBase({
      "*": {
        borderColor: "var(--border-base)",
      },
    })

    addComponents(typography)

    addBase({
      ":root": { ...colors.light, ...effects.light },
      ...components.light,
    })

    if (darkMode === "class") {
      addBase({
        [className]: { ...colors.dark, ...effects.dark },
      })
    } else {
      addBase({
        "@media (prefers-color-scheme: dark)": {
          ":root": { ...colors.dark, ...effects.dark },
          ...components.dark,
        },
      })
    }

    // Design-language themes (STYLE axis): opt-in via <html data-theme="...">.
    // Light tokens at [data-theme]; dark tokens at [data-theme].dark (higher
    // specificity), so STYLE × MODE compose independently. Emitted after
    // :root/.dark so equal-specificity light rules win by source order.
    for (const theme of Object.values(themes)) {
      addBase({
        [`[data-theme="${theme.name}"]`]: {
          colorScheme: "light",
          ...theme.light,
        },
        [`[data-theme="${theme.name}"].dark`]: {
          colorScheme: "dark",
          ...theme.dark,
        },
      })
    }
  },
  {
    theme: {
      extend: {
        ...theme.extend,
        fontFamily: {
          sans: FONT_FAMILY_SANS,
          mono: FONT_FAMILY_MONO,
        },
        transitionProperty: {
          fg: "color, background-color, border-color, box-shadow, opacity",
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0px" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0px" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
  }
)
