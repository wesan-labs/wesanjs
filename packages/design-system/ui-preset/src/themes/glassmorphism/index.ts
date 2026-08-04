import { defineTheme } from "../build-tokens"
import { AURORA_MESH_DARK, REF } from "../shared/pro-palette"

/** Legacy full-surface frosted glass — vivid gradient backdrop. */
export const glassmorphism = defineTheme({
  name: "glassmorphism",
  label: "Glassmorphism (legacy)",
  material: "frosted",
  glassScope: "all",
  frostedSurfaces: true,
  light: {
    palette: {
      canvas: "rgba(255, 255, 255, 0.40)",
      surface: "rgba(255, 255, 255, 0.72)",
      elevated: "rgba(255, 255, 255, 0.65)",
      field: "rgba(255, 255, 255, 0.58)",
      text: "#14141F",
      textMuted: "#43435A",
      textSubtle: "#65657D",
      accent: REF.violetDeep,
      accentHover: REF.violet,
      accentFg: "#6D28D9",
      onAccent: REF.white,
      border: "rgba(255, 255, 255, 0.55)",
      borderStrong: "rgba(255, 255, 255, 0.78)",
      borderStyle: "soft",
      radius: REF.radiusMd,
      borderWidth: "1px",
      shadow:
        "0 10px 40px rgba(99, 102, 241, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
      shadowPressed: "inset 0 2px 8px rgba(99, 102, 241, 0.16)",
      blur: "20px",
      glow: "0 0 32px rgba(157, 123, 255, 0.28)",
      focusRing: `3px solid ${REF.violetDeep}`,
      focusRingOffset: "2px",
    },
    extra: {
      "--app-backdrop":
        "linear-gradient(135deg, #6366F1 0%, #A855F7 32%, #EC4899 68%, #F43F5E 100%)",
      "--opacity-surface": "0.72",
      "--surface-solid-fallback": "#F8F8FC",
    },
  },
  dark: {
    palette: {
      canvas: "rgba(12, 14, 28, 0.45)",
      surface: "rgba(22, 24, 38, 0.65)",
      elevated: "rgba(28, 30, 46, 0.58)",
      field: "rgba(18, 20, 32, 0.52)",
      text: "#F4F5FF",
      textMuted: "#B0B6D6",
      textSubtle: "#8086A8",
      accent: REF.violet,
      accentFg: "#C4B5FD",
      onAccent: "#0F1020",
      border: "rgba(255, 255, 255, 0.12)",
      borderStrong: "rgba(255, 255, 255, 0.20)",
      borderStyle: "soft",
      radius: REF.radiusMd,
      borderWidth: "1px",
      shadow:
        "0 12px 40px rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      shadowPressed: "inset 0 2px 8px rgba(0, 0, 0, 0.55)",
      blur: "22px",
      glow: "0 0 36px rgba(157, 123, 255, 0.32)",
      focusRing: `3px solid ${REF.violet}`,
      focusRingOffset: "2px",
    },
    extra: {
      "--app-backdrop": AURORA_MESH_DARK,
      "--opacity-surface": "0.65",
      "--surface-solid-fallback": "#16182A",
    },
  },
})
