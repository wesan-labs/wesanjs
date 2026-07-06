import { defineTheme } from "../build-tokens"

const NEU_SHADOW_LIGHT =
  "-7px -7px 14px rgba(255, 255, 255, 0.95), 7px 7px 16px rgba(163, 177, 198, 0.5)"
const NEU_SHADOW_DARK =
  "-7px -7px 14px rgba(58, 64, 74, 0.85), 7px 7px 16px rgba(12, 14, 18, 0.75)"

export const neumorphism = defineTheme({
  name: "neumorphism",
  label: "Neumorphism",
  light: {
    palette: {
      canvas: "#e0e5ec",
      surface: "#e0e5ec",
      elevated: "#e0e5ec",
      field: "#d6dbe2",
      text: "#1c2530",
      textMuted: "#4a5460",
      textSubtle: "#6b7480",
      accent: "#3b5bdb",
      accentFg: "#2f4ac4",
      onAccent: "#ffffff",
      border: "rgba(163, 177, 198, 0.35)",
      borderStrong: "rgba(110, 122, 140, 0.5)",
      borderStyle: "soft",
      radius: "18px",
      borderWidth: "1px",
      shadow: NEU_SHADOW_LIGHT,
      shadowPressed:
        "inset -5px -5px 10px rgba(255, 255, 255, 0.85), inset 5px 5px 12px rgba(163, 177, 198, 0.55)",
      blur: "12px",
      glow: "0 0 0 3px rgba(59, 91, 219, 0.3)",
      focusRing: "3px solid #3b5bdb",
      focusRingOffset: "2px",
    },
    extra: {
      "--button-inverted": "#3b5bdb",
      "--button-inverted-hover": "#2f4ac4",
      "--button-inverted-pressed": "#2840b0",
    },
  },
  dark: {
    palette: {
      canvas: "#2b3038",
      surface: "#2b3038",
      elevated: "#2b3038",
      field: "#313742",
      text: "#eef1f5",
      textMuted: "#aab3c0",
      textSubtle: "#828d9c",
      accent: "#6f9bff",
      accentFg: "#93b8ff",
      onAccent: "#0c1320",
      border: "rgba(0, 0, 0, 0.35)",
      borderStrong: "rgba(0, 0, 0, 0.5)",
      borderStyle: "soft",
      radius: "18px",
      borderWidth: "1px",
      shadow: NEU_SHADOW_DARK,
      shadowPressed:
        "inset -5px -5px 10px rgba(54, 60, 70, 0.85), inset 5px 5px 12px rgba(15, 18, 22, 0.75)",
      blur: "12px",
      glow: "0 0 0 3px rgba(111, 155, 255, 0.35)",
      focusRing: "3px solid #6f9bff",
      focusRingOffset: "2px",
    },
    extra: {
      "--button-inverted": "#6f9bff",
      "--button-inverted-hover": "#93b8ff",
      "--button-inverted-pressed": "#5a8aef",
    },
  },
})
