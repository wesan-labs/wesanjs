import { defineTheme } from "../build-tokens"

/** Legacy full-surface frosted glass — kept for saved user preferences. */
export const glassmorphism = defineTheme({
  name: "glassmorphism",
  label: "Glassmorphism (legacy)",
  material: "frosted",
  glassScope: "all",
  frostedSurfaces: true,
  light: {
    palette: {
      canvas: "rgba(255, 255, 255, 0.35)",
      surface: "rgba(255, 255, 255, 0.78)",
      elevated: "rgba(255, 255, 255, 0.68)",
      field: "rgba(255, 255, 255, 0.85)",
      text: "#14141f",
      textMuted: "#43435a",
      textSubtle: "#65657d",
      accent: "#4f46e5",
      accentFg: "#4338ca",
      onAccent: "#ffffff",
      border: "rgba(255, 255, 255, 0.55)",
      borderStrong: "rgba(255, 255, 255, 0.8)",
      borderStyle: "soft",
      radius: "18px",
      borderWidth: "1px",
      shadow:
        "0 10px 40px rgba(49, 46, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
      shadowPressed: "inset 0 2px 8px rgba(49, 46, 129, 0.18)",
      blur: "20px",
      glow: "0 0 32px rgba(99, 102, 241, 0.3)",
      focusRing: "3px solid #4f46e5",
      focusRingOffset: "2px",
    },
    extra: {
      "--app-backdrop":
        "linear-gradient(135deg, #6366f1 0%, #a855f7 38%, #ec4899 72%, #f43f5e 100%)",
      "--opacity-surface": "0.78",
      "--surface-solid-fallback": "#f8f8fc",
    },
  },
  dark: {
    palette: {
      canvas: "rgba(10, 12, 24, 0.45)",
      surface: "rgba(22, 24, 38, 0.72)",
      elevated: "rgba(28, 30, 46, 0.62)",
      field: "rgba(18, 20, 32, 0.78)",
      text: "#f4f5ff",
      textMuted: "#b0b6d6",
      textSubtle: "#8086a8",
      accent: "#818cf8",
      accentFg: "#a5b4fc",
      onAccent: "#0f1020",
      border: "rgba(255, 255, 255, 0.12)",
      borderStrong: "rgba(255, 255, 255, 0.2)",
      borderStyle: "soft",
      radius: "18px",
      borderWidth: "1px",
      shadow:
        "0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      shadowPressed: "inset 0 2px 8px rgba(0, 0, 0, 0.55)",
      blur: "22px",
      glow: "0 0 36px rgba(129, 140, 248, 0.35)",
      focusRing: "3px solid #818cf8",
      focusRingOffset: "2px",
    },
    extra: {
      "--app-backdrop":
        "radial-gradient(120% 100% at 10% 0%, #1e1b4b 0%, #0f1020 50%, #050510 100%)",
      "--opacity-surface": "0.72",
      "--surface-solid-fallback": "#16182a",
    },
  },
})
