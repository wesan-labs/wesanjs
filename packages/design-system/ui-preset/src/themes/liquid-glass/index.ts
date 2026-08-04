import { defineTheme } from "../build-tokens"
import {
  AURORA_MESH_DARK,
  AURORA_MESH_LIGHT,
  CHROME_DARK_DARK,
  CHROME_DARK_LIGHT,
  REF,
} from "../shared/pro-palette"

const LIQUID_GLASS_EXTRA_LIGHT = {
  "--app-backdrop": AURORA_MESH_LIGHT,
  "--glass-blur": "18px",
  "--glass-blur-nav": "16px",
  "--glass-blur-flyout": "20px",
  "--glass-blur-modal": "24px",
  "--glass-specular":
    "inset 0 1px 0 rgba(255,255,255,0.60), inset 0 -1px 0 rgba(255,255,255,0.06)",
  "--glass-scrim": "rgba(15, 23, 42, 0.06)",
  "--surface-solid-fallback": REF.cream,
  "--opacity-surface": "0.88",
  "--opacity-field": "0.94",
  ...CHROME_DARK_LIGHT,
}

const LIQUID_GLASS_EXTRA_DARK = {
  "--app-backdrop": AURORA_MESH_DARK,
  "--glass-blur": "20px",
  "--glass-blur-nav": "16px",
  "--glass-blur-flyout": "22px",
  "--glass-blur-modal": "26px",
  "--glass-specular":
    "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.04)",
  "--glass-scrim": "rgba(0, 0, 0, 0.24)",
  "--surface-solid-fallback": "#0C0C10",
  "--opacity-surface": "0.78",
  "--opacity-field": "0.85",
  ...CHROME_DARK_DARK,
}

/** iOS-style liquid glass — aurora backdrop, frosted chrome, cream content surface. */
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
      canvas: "rgba(249, 248, 243, 0.72)",
      surface: "rgba(255, 255, 255, 0.88)",
      elevated: "rgba(255, 255, 255, 0.92)",
      field: "rgba(255, 255, 255, 0.94)",
      text: REF.ink,
      textMuted: REF.inkMuted,
      textSubtle: REF.inkSubtle,
      accent: REF.violetInteractive,
      accentHover: REF.violetInteractiveHover,
      accentFg: REF.violetDeep,
      onAccent: REF.white,
      border: "rgba(255, 255, 255, 0.55)",
      borderStrong: "rgba(255, 255, 255, 0.72)",
      borderStyle: "soft",
      radius: REF.radiusLg,
      borderWidth: "1px",
      shadow:
        "0 8px 32px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.60)",
      shadowSm:
        "0 4px 16px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.50)",
      shadowMd:
        "0 8px 32px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.60)",
      shadowLg:
        "0 12px 40px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.65)",
      shadowPressed: "inset 0 2px 8px rgba(15, 23, 42, 0.12)",
      blur: "18px",
      glow: "0 0 0 1px rgba(255, 255, 255, 0.30)",
      focusRing: `3px solid ${REF.violet}`,
      focusRingOffset: "2px",
    },
    extra: LIQUID_GLASS_EXTRA_LIGHT,
  },
  dark: {
    palette: {
      canvas: "rgba(12, 12, 16, 0.55)",
      surface: "rgba(24, 24, 32, 0.78)",
      elevated: "rgba(30, 30, 40, 0.82)",
      field: "rgba(18, 18, 26, 0.85)",
      text: "#F2F3FA",
      textMuted: "#B0B6D6",
      textSubtle: "#8086A8",
      accent: REF.violetInteractive,
      accentHover: REF.violetInteractiveHover,
      accentFg: "#C4B5FD",
      onAccent: REF.white,
      border: "rgba(255, 255, 255, 0.12)",
      borderStrong: "rgba(255, 255, 255, 0.20)",
      borderStyle: "soft",
      radius: REF.radiusLg,
      borderWidth: "1px",
      shadow:
        "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
      shadowSm:
        "0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      shadowMd:
        "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
      shadowLg:
        "0 16px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      shadowPressed: "inset 0 2px 8px rgba(0, 0, 0, 0.5)",
      blur: "20px",
      glow: "0 0 0 1px rgba(255, 255, 255, 0.08)",
      focusRing: `3px solid ${REF.violet}`,
      focusRingOffset: "2px",
    },
    extra: LIQUID_GLASS_EXTRA_DARK,
  },
})
