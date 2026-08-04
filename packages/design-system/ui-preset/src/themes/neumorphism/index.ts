import { defineTheme } from "../build-tokens"

const NEU_SHADOW_LIGHT =
  "-7px -7px 14px rgba(255, 255, 255, 0.95), 7px 7px 16px rgba(163, 177, 198, 0.50)"
const NEU_SHADOW_DARK =
  "-7px -7px 14px rgba(58, 64, 74, 0.85), 7px 7px 16px rgba(12, 14, 18, 0.75)"

/** Neumorphism — soft extruded surfaces, dual-tone shadows. */
export const neumorphism = defineTheme({
  name: "neumorphism",
  label: "Neumorphism",
  light: {
    palette: {
      canvas: "#D6DBE2",
      surface: "#E0E5EC",
      elevated: "#E0E5EC",
      field: "#D6DBE2",
      text: "#1C2530",
      textMuted: "#4A5460",
      textSubtle: "#6B7480",
      accent: "#3B5BDB",
      accentHover: "#2F4AC4",
      accentFg: "#2F4AC4",
      onAccent: "#FFFFFF",
      border: "rgba(163, 177, 198, 0.35)",
      borderStrong: "rgba(110, 122, 140, 0.50)",
      borderStyle: "soft",
      radius: "18px",
      borderWidth: "1px",
      shadow: NEU_SHADOW_LIGHT,
      shadowPressed:
        "inset -5px -5px 10px rgba(255, 255, 255, 0.85), inset 5px 5px 12px rgba(163, 177, 198, 0.55)",
      blur: "12px",
      glow: "0 0 0 3px rgba(59, 91, 219, 0.30)",
      focusRing: "3px solid #3B5BDB",
      focusRingOffset: "2px",
    },
    extra: {
      "--button-inverted": "#3B5BDB",
      "--button-inverted-hover": "#2F4AC4",
      "--button-inverted-pressed": "#2840B0",
    },
  },
  dark: {
    palette: {
      canvas: "#313742",
      surface: "#2B3038",
      elevated: "#2B3038",
      field: "#313742",
      text: "#EEF1F5",
      textMuted: "#AAB3C0",
      textSubtle: "#828D9C",
      accent: "#6F9BFF",
      accentHover: "#93B8FF",
      accentFg: "#93B8FF",
      onAccent: "#0C1320",
      border: "rgba(0, 0, 0, 0.35)",
      borderStrong: "rgba(0, 0, 0, 0.50)",
      borderStyle: "soft",
      radius: "18px",
      borderWidth: "1px",
      shadow: NEU_SHADOW_DARK,
      shadowPressed:
        "inset -5px -5px 10px rgba(54, 60, 70, 0.85), inset 5px 5px 12px rgba(15, 18, 22, 0.75)",
      blur: "12px",
      glow: "0 0 0 3px rgba(111, 155, 255, 0.35)",
      focusRing: "3px solid #6F9BFF",
      focusRingOffset: "2px",
    },
    extra: {
      "--button-inverted": "#6F9BFF",
      "--button-inverted-hover": "#93B8FF",
      "--button-inverted-pressed": "#5A8AEF",
    },
  },
})
