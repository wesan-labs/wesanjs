import { defineTheme } from "../build-tokens"

const LIQUID_LIGHT_BG =
  "radial-gradient(70% 90% at 10% 5%, oklch(0.82 0.18 285 / 0.65), transparent 55%), radial-gradient(60% 80% at 90% 10%, oklch(0.85 0.14 250 / 0.5), transparent 50%), radial-gradient(50% 60% at 50% 100%, oklch(0.88 0.12 320 / 0.4), transparent 55%), oklch(0.94 0.04 285)"

const LIQUID_DARK_BG =
  "radial-gradient(60% 80% at 8% 5%, oklch(0.42 0.20 285 / 0.55), transparent 55%), radial-gradient(55% 75% at 92% 8%, oklch(0.38 0.16 250 / 0.45), transparent 50%), oklch(0.12 0.04 265)"

const LIQUID_GLASS_EXTRA_LIGHT = {
  "--app-backdrop": LIQUID_LIGHT_BG,
  "--glass-blur": "16px",
  "--glass-blur-nav": "14px",
  "--glass-blur-flyout": "18px",
  "--glass-blur-modal": "22px",
  "--glass-specular":
    "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.08)",
  "--glass-scrim": "rgba(15, 23, 42, 0.08)",
  "--surface-solid-fallback": "oklch(0.98 0.01 285)",
  "--opacity-surface": "0.88",
  "--opacity-field": "0.92",
}

const LIQUID_GLASS_EXTRA_DARK = {
  "--app-backdrop": LIQUID_DARK_BG,
  "--glass-blur": "18px",
  "--glass-blur-nav": "14px",
  "--glass-blur-flyout": "18px",
  "--glass-blur-modal": "22px",
  "--glass-specular":
    "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)",
  "--glass-scrim": "rgba(0, 0, 0, 0.22)",
  "--surface-solid-fallback": "oklch(0.18 0.03 265)",
  "--opacity-surface": "0.78",
  "--opacity-field": "0.85",
}

export const liquidGlass = defineTheme({
  name: "liquid-glass",
  label: "Liquid Glass",
  material: "liquid",
  liquidGlass: true,
  glassVariant: "regular",
  glassScope: "chrome",
  frostedSurfaces: true,
  light: {
    palette: {
      canvas: "oklch(0.94 0.05 285 / 0.45)",
      surface: "oklch(0.97 0.04 285 / 0.82)",
      elevated: "oklch(0.98 0.03 285 / 0.88)",
      field: "oklch(0.99 0.02 285 / 0.94)",
      text: "#12121a",
      textMuted: "#43435a",
      textSubtle: "#5c5c6e",
      accent: "#5b4ef0",
      accentFg: "#4338ca",
      onAccent: "#ffffff",
      border: "rgba(255, 255, 255, 0.45)",
      borderStrong: "rgba(255, 255, 255, 0.65)",
      borderStyle: "soft",
      radius: "20px",
      borderWidth: "1px",
      shadow:
        "0 8px 32px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
      shadowSm:
        "0 4px 16px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.45)",
      shadowMd:
        "0 8px 32px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
      shadowLg:
        "0 12px 40px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
      shadowPressed: "inset 0 2px 8px rgba(15, 23, 42, 0.15)",
      blur: "16px",
      glow: "0 0 0 1px rgba(255, 255, 255, 0.25)",
      focusRing: "3px solid #4f46e5",
      focusRingOffset: "2px",
    },
    extra: LIQUID_GLASS_EXTRA_LIGHT,
  },
  dark: {
    palette: {
      canvas: "rgba(10, 12, 24, 0.35)",
      surface: "rgba(22, 24, 38, 0.78)",
      elevated: "rgba(28, 30, 46, 0.82)",
      field: "rgba(18, 20, 32, 0.85)",
      text: "#f2f3fa",
      textMuted: "#b0b6d6",
      textSubtle: "#8086a8",
      accent: "#818cf8",
      accentFg: "#a5b4fc",
      onAccent: "#0f1020",
      border: "rgba(255, 255, 255, 0.14)",
      borderStrong: "rgba(255, 255, 255, 0.22)",
      borderStyle: "soft",
      radius: "20px",
      borderWidth: "1px",
      shadow:
        "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      shadowSm:
        "0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      shadowMd:
        "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      shadowLg:
        "0 16px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      shadowPressed: "inset 0 2px 8px rgba(0, 0, 0, 0.5)",
      blur: "18px",
      glow: "0 0 0 1px rgba(255, 255, 255, 0.08)",
      focusRing: "3px solid #818cf8",
      focusRingOffset: "2px",
    },
    extra: LIQUID_GLASS_EXTRA_DARK,
  },
})
