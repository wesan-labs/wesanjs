import { defineTheme } from "../build-tokens"
import { REF } from "../shared/pro-palette"

const CLAY_SHADOW_LIGHT =
  "14px 16px 32px rgba(76, 58, 160, 0.28), inset 8px 10px 16px rgba(255, 255, 255, 0.55), inset -8px -10px 18px rgba(76, 58, 160, 0.20)"
const CLAY_SHADOW_DARK =
  "14px 16px 36px rgba(0, 0, 0, 0.50), inset 8px 10px 16px rgba(255, 255, 255, 0.10), inset -8px -10px 20px rgba(0, 0, 0, 0.40)"
const CLAY_CTA_SHADOW_LIGHT =
  "10px 12px 24px rgba(76, 58, 160, 0.35), inset 6px 8px 12px rgba(255, 255, 255, 0.50), inset -6px -8px 14px rgba(76, 58, 160, 0.25)"
const CLAY_CTA_SHADOW_DARK =
  "10px 12px 28px rgba(0, 0, 0, 0.55), inset 6px 8px 12px rgba(255, 255, 255, 0.08), inset -6px -8px 16px rgba(0, 0, 0, 0.45)"

/** Claymorphism — puffy 3D clay surfaces, purple family. */
export const claymorphism = defineTheme({
  name: "claymorphism",
  label: "Claymorphism",
  light: {
    palette: {
      canvas: "#E7E0FB",
      surface: "#EFE9FF",
      elevated: "#CFC6F5",
      field: "#DDD6FA",
      text: "#312562",
      textMuted: "#5A4FA0",
      textSubtle: "#6A5F98",
      accent: "#5B4AE0",
      accentHover: "#4A3AD0",
      accentFg: "#5B4AE0",
      onAccent: REF.white,
      border: "rgba(91, 74, 224, 0.12)",
      borderStrong: "rgba(91, 74, 224, 0.25)",
      borderStyle: "none",
      radius: "28px",
      borderWidth: "0px",
      shadow: CLAY_SHADOW_LIGHT,
      shadowPressed:
        "6px 8px 16px rgba(76, 58, 160, 0.20), inset 10px 12px 20px rgba(76, 58, 160, 0.25), inset -6px -6px 12px rgba(255, 255, 255, 0.40)",
      blur: "8px",
      glow: "0 0 24px rgba(91, 74, 224, 0.30)",
      focusRing: "3px solid #5B4AE0",
      focusRingOffset: "2px",
      tags: {
        purple: {
          bg: "#DDD6FA",
          bgHover: "#CFC6F5",
          text: "#312562",
          border: "rgba(91, 74, 224, 0.20)",
          icon: "#5B4AE0",
        },
      },
    },
    extra: {
      "--radius-button": "18px",
      "--shadow-clay-cta": CLAY_CTA_SHADOW_LIGHT,
      "--shadow-nav": "0 1px 2px rgba(76, 58, 160, 0.08)",
      "--button-inverted": "#5B4AE0",
      "--button-inverted-hover": "#4A3AD0",
      "--button-inverted-pressed": "#3D2EC0",
    },
  },
  dark: {
    palette: {
      canvas: "#1D1A3A",
      surface: "#15132B",
      elevated: "#3A3568",
      field: "#2A2650",
      text: "#F1EDFF",
      textMuted: "#B9B2E6",
      textSubtle: "#837BB8",
      accent: "#6C5CE7",
      accentHover: "#7D6EF0",
      accentFg: "#B8AEFF",
      onAccent: REF.white,
      border: "rgba(255, 255, 255, 0.08)",
      borderStrong: "rgba(255, 255, 255, 0.16)",
      borderStyle: "none",
      radius: "28px",
      borderWidth: "0px",
      shadow: CLAY_SHADOW_DARK,
      shadowPressed:
        "6px 8px 18px rgba(0, 0, 0, 0.45), inset 10px 12px 22px rgba(0, 0, 0, 0.50), inset -6px -6px 12px rgba(255, 255, 255, 0.06)",
      blur: "10px",
      glow: "0 0 28px rgba(108, 92, 231, 0.45)",
      focusRing: "3px solid #6C5CE7",
      focusRingOffset: "2px",
    },
    extra: {
      "--radius-button": "18px",
      "--shadow-clay-cta": CLAY_CTA_SHADOW_DARK,
      "--shadow-nav": "0 1px 2px rgba(0, 0, 0, 0.25)",
      "--button-inverted": "#6C5CE7",
      "--button-inverted-hover": "#7D6EF0",
      "--button-inverted-pressed": "#5A4AD8",
    },
  },
})
