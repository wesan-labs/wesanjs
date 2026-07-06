import plugin from "tailwindcss/plugin"
import { FONT_FAMILY_MONO, FONT_FAMILY_SANS } from "./constants"
import { theme } from "./theme/extension/theme"
import { colors } from "./theme/tokens/colors"
import { components } from "./theme/tokens/components"
import { effects } from "./theme/tokens/effects"
import { typography } from "./theme/tokens/typography"
import { themes } from "./themes"
import { resolveGlassScope, resolveMaterial } from "./themes/types"

const GLASS_FILTER =
  "blur(var(--glass-blur, var(--blur))) saturate(180%) brightness(1.05) contrast(1.05)"

const CHROME_SURFACE_SELECTOR =
  ":is([data-glass-chrome], .shadow-elevation-flyout, .shadow-elevation-modal)"

const ALL_FROSTED_SELECTOR =
  ":is(.bg-ui-bg-base, .bg-ui-bg-base-hover, .bg-ui-bg-component, .bg-ui-bg-component-hover, .bg-ui-bg-field)"

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
    for (const themeDef of Object.values(themes)) {
      const themeSelector = `[data-theme="${themeDef.name}"]`
      const material = resolveMaterial(themeDef)
      const glassScope = resolveGlassScope(themeDef)
      const isTranslucent = material === "frosted" || material === "liquid"

      addBase({
        [themeSelector]: {
          colorScheme: "light",
          backgroundColor: "var(--bg-subtle)",
          minHeight: "100%",
          ...themeDef.light,
        },
        [`${themeSelector}.dark`]: {
          colorScheme: "dark",
          backgroundColor: "var(--bg-subtle)",
          ...themeDef.dark,
        },
        [`${themeSelector} #root`]: {
          minHeight: "100vh",
        },
        [`${themeSelector} [data-glass-chrome]`]: {
          backgroundColor: "var(--bg-subtle)",
          borderColor: "var(--border-base)",
        },
      })

      // Global focus ring per theme tokens.
      addBase({
        [`${themeSelector} :focus-visible`]: {
          outline: "var(--focus-ring)",
          outlineOffset: "var(--focus-ring-offset)",
        },
      })

      if (isTranslucent) {
        const frostedTarget =
          glassScope === "chrome"
            ? `${themeSelector} ${CHROME_SURFACE_SELECTOR}`
            : `${themeSelector} ${ALL_FROSTED_SELECTOR}`

        addBase({
          [themeSelector]: {
            backgroundImage: "var(--app-backdrop)",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundColor: "var(--surface-solid-fallback, var(--bg-subtle))",
          },
          [frostedTarget]: {
            backdropFilter: GLASS_FILTER,
            WebkitBackdropFilter: GLASS_FILTER,
          },
        })

        if (material === "liquid" || themeDef.liquidGlass) {
          addBase({
            [frostedTarget]: {
              boxShadow:
                "var(--shadow), var(--glass-specular, inset 0 1px 0 rgba(255,255,255,0.45))",
            },
          })
        }

        // Solid fallback when user prefers reduced transparency.
        addBase({
          "@media (prefers-reduced-transparency: reduce)": {
            [frostedTarget]: {
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            },
            [`${themeSelector} ${ALL_FROSTED_SELECTOR}`]: {
              backgroundColor: "var(--surface-solid-fallback, var(--bg-base))",
            },
          },
        })
      }

      const surfaceSelectors = [
        ".shadow-elevation-card-rest",
        ".shadow-elevation-card-hover",
        ".shadow-elevation-flyout",
        ".shadow-elevation-modal",
        ".shadow-elevation-tooltip",
      ].join(", ")

      addBase({
        [`${themeSelector} :is(.rounded-lg, .rounded-md, .rounded-xl)`]: {
          borderRadius: "var(--radius)",
        },
        [`${themeSelector} ${surfaceSelectors}`]: {
          boxShadow: "var(--shadow)",
        },
        [`${themeSelector} .shadow-elevation-flyout`]: {
          boxShadow: "var(--shadow-md, var(--shadow))",
        },
        [`${themeSelector} .shadow-elevation-modal`]: {
          boxShadow: "var(--shadow-lg, var(--shadow-md, var(--shadow)))",
        },
        [`${themeSelector} :is(.shadow-borders-base, .shadow-buttons-neutral)`]:
          {
            boxShadow: "var(--borders-base)",
          },
      })

      if (themeDef.hardSurface) {
        addBase({
          [`${themeSelector} .shadow-elevation-card-rest`]: {
            boxShadow: "var(--shadow)",
            borderWidth: "var(--border-width)",
            borderStyle: "solid",
            borderColor: "var(--border-base)",
          },
        })

        addBase({
          "@media (prefers-reduced-motion: no-preference)": {
            [`${themeSelector} .shadow-elevation-card-rest:hover`]: {
              transform: "translate(-2px, -2px)",
              boxShadow: "var(--shadow-md, var(--shadow))",
            },
            [`${themeSelector} .shadow-elevation-card-rest:active`]: {
              transform: "translate(2px, 2px)",
              boxShadow: "var(--shadow-pressed)",
            },
          },
        })
      }
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
