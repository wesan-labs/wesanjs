import { defineTheme } from "../build-tokens"

const CLAY_SHADOW_LIGHT =
  "14px 16px 32px rgba(76, 58, 160, 0.28), inset 8px 10px 16px rgba(255, 255, 255, 0.55), inset -8px -10px 18px rgba(76, 58, 160, 0.2)"
const CLAY_SHADOW_DARK =
  "14px 16px 36px rgba(0, 0, 0, 0.5), inset 8px 10px 16px rgba(255, 255, 255, 0.1), inset -8px -10px 20px rgba(0, 0, 0, 0.4)"
const CLAY_CTA_SHADOW_LIGHT =
  "10px 12px 24px rgba(76, 58, 160, 0.35), inset 6px 8px 12px rgba(255, 255, 255, 0.5), inset -6px -8px 14px rgba(76, 58, 160, 0.25)"
const CLAY_CTA_SHADOW_DARK =
  "10px 12px 28px rgba(0, 0, 0, 0.55), inset 6px 8px 12px rgba(255, 255, 255, 0.08), inset -6px -8px 16px rgba(0, 0, 0, 0.45)"

export const claymorphism = defineTheme({
  name: "claymorphism",
  label: "Claymorphism",
  light: {
    palette: {
      canvas: "#efe9ff",
      surface: "#e7e0fb",
      elevated: "#cfc6f5",
      field: "#ddd6fa",
      text: "#312562",
      textMuted: "#5a4fa0",
      textSubtle: "#6a5f98",
      accent: "#5b4ae0",
      accentFg: "#5b4ae0",
      onAccent: "#ffffff",
      border: "rgba(91, 74, 224, 0.12)",
      borderStrong: "rgba(91, 74, 224, 0.25)",
      borderStyle: "none",
      radius: "28px",
      borderWidth: "0px",
      shadow: CLAY_SHADOW_LIGHT,
      shadowPressed:
        "6px 8px 16px rgba(76, 58, 160, 0.2), inset 10px 12px 20px rgba(76, 58, 160, 0.25), inset -6px -6px 12px rgba(255, 255, 255, 0.4)",
      blur: "8px",
      glow: "0 0 24px rgba(91, 74, 224, 0.3)",
      focusRing: "3px solid #5b4ae0",
      focusRingOffset: "2px",
      tags: {
        purple: {
          bg: "#ddd6fa",
          bgHover: "#cfc6f5",
          text: "#312562",
          border: "rgba(91, 74, 224, 0.2)",
          icon: "#5b4ae0",
        },
      },
    },
    extra: {
      "--radius-button": "18px",
      "--shadow-clay-cta": CLAY_CTA_SHADOW_LIGHT,
      "--shadow-nav": "0 1px 2px rgba(76, 58, 160, 0.08)",
      "--button-inverted": "#5b4ae0",
      "--button-inverted-hover": "#4a3ad0",
      "--button-inverted-pressed": "#3d2ec0",
    },
  },
  dark: {
    palette: {
      canvas: "#15132b",
      surface: "#1d1a3a",
      elevated: "#3a3568",
      field: "#2a2650",
      text: "#f1edff",
      textMuted: "#b9b2e6",
      textSubtle: "#837bb8",
      accent: "#6c5ce7",
      accentFg: "#b8aeff",
      onAccent: "#ffffff",
      border: "rgba(255, 255, 255, 0.08)",
      borderStrong: "rgba(255, 255, 255, 0.16)",
      borderStyle: "none",
      radius: "28px",
      borderWidth: "0px",
      shadow: CLAY_SHADOW_DARK,
      shadowPressed:
        "6px 8px 18px rgba(0, 0, 0, 0.45), inset 10px 12px 22px rgba(0, 0, 0, 0.5), inset -6px -6px 12px rgba(255, 255, 255, 0.06)",
      blur: "10px",
      glow: "0 0 28px rgba(108, 92, 231, 0.45)",
      focusRing: "3px solid #6c5ce7",
      focusRingOffset: "2px",
    },
    extra: {
      "--radius-button": "18px",
      "--shadow-clay-cta": CLAY_CTA_SHADOW_DARK,
      "--shadow-nav": "0 1px 2px rgba(0, 0, 0, 0.25)",
      "--button-inverted": "#6c5ce7",
      "--button-inverted-hover": "#7d6ef0",
      "--button-inverted-pressed": "#5a4ad8",
    },
  },
})
