import { defineTheme } from "../build-tokens"

const AURORA_LIGHT_BG =
  "radial-gradient(60% 80% at 15% 10%, oklch(0.88 0.12 285 / 0.5), transparent 60%), radial-gradient(50% 70% at 85% 15%, oklch(0.90 0.10 195 / 0.4), transparent 55%), radial-gradient(55% 75% at 75% 90%, oklch(0.92 0.10 330 / 0.45), transparent 60%), radial-gradient(50% 65% at 20% 95%, oklch(0.90 0.12 250 / 0.4), transparent 55%), oklch(0.97 0.02 285)"

const AURORA_DARK_BG =
  "radial-gradient(55% 75% at 12% 8%, oklch(0.52 0.16 285 / 0.38), transparent 60%), radial-gradient(50% 70% at 88% 12%, oklch(0.48 0.14 195 / 0.28), transparent 55%), radial-gradient(60% 80% at 80% 92%, oklch(0.55 0.16 330 / 0.32), transparent 60%), radial-gradient(50% 65% at 18% 95%, oklch(0.50 0.15 250 / 0.3), transparent 55%), oklch(0.14 0.03 265)"

export const aurora = defineTheme({
  name: "aurora",
  label: "Aurora UI",
  material: "frosted",
  glassScope: "chrome",
  frostedSurfaces: true,
  light: {
    palette: {
      canvas: "oklch(0.97 0.02 285 / 0.55)",
      surface: "oklch(0.99 0.02 285 / 0.88)",
      elevated: "oklch(0.99 0.02 285 / 0.85)",
      field: "oklch(0.99 0.01 285 / 0.92)",
      text: "#1a1626",
      textMuted: "#4a4458",
      textSubtle: "#6b6478",
      accent: "#7c3aed",
      accentFg: "#6d28d9",
      onAccent: "#ffffff",
      border: "oklch(0.88 0.04 285 / 0.7)",
      borderStrong: "oklch(0.78 0.05 285 / 0.85)",
      borderStyle: "soft",
      radius: "16px",
      borderWidth: "1px",
      shadow:
        "0 4px 16px -4px oklch(0.55 0.12 285 / 0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
      shadowMd:
        "0 10px 28px -8px oklch(0.55 0.12 285 / 0.18), inset 0 1px 0 rgba(255,255,255,0.5)",
      shadowLg:
        "0 12px 32px -8px oklch(0.55 0.12 285 / 0.22), inset 0 1px 0 rgba(255,255,255,0.55)",
      shadowPressed: "inset 0 2px 6px oklch(0.50 0.10 285 / 0.18)",
      blur: "20px",
      glow: "0 0 0 3px oklch(0.55 0.18 285 / 0.25)",
      focusRing: "3px solid #7c3aed",
      focusRingOffset: "2px",
    },
    extra: {
      "--app-backdrop": AURORA_LIGHT_BG,
      "--opacity-surface": "0.88",
      "--opacity-field": "0.92",
      "--surface-solid-fallback": "oklch(0.98 0.02 285)",
      "--atmosphere-violet": "#9d5cf5",
      "--atmosphere-teal": "#2dd4bf",
      "--atmosphere-rose": "#f472b6",
      "--atmosphere-blue": "#5b9df9",
    },
  },
  dark: {
    palette: {
      canvas: "oklch(0.18 0.04 265 / 0.55)",
      surface: "oklch(0.22 0.05 265 / 0.85)",
      elevated: "oklch(0.24 0.05 265 / 0.82)",
      field: "oklch(0.20 0.04 265 / 0.88)",
      text: "#f4f2ff",
      textMuted: "#b8b4d8",
      textSubtle: "#8a86ae",
      accent: "#a78bfa",
      accentFg: "#c4b5fd",
      onAccent: "#0a0a1a",
      border: "oklch(0.38 0.06 265 / 0.5)",
      borderStrong: "oklch(0.48 0.08 265 / 0.65)",
      borderStyle: "soft",
      radius: "16px",
      borderWidth: "1px",
      shadow:
        "0 8px 24px -6px oklch(0.12 0.06 265 / 0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
      shadowMd:
        "0 12px 32px -8px oklch(0.10 0.06 265 / 0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      shadowLg:
        "0 16px 40px -8px oklch(0.08 0.06 265 / 0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
      shadowPressed: "inset 0 2px 8px oklch(0.08 0.05 265 / 0.6)",
      blur: "22px",
      glow: "0 0 0 3px oklch(0.65 0.18 285 / 0.35)",
      focusRing: "3px solid #a78bfa",
      focusRingOffset: "2px",
    },
    extra: {
      "--app-backdrop": AURORA_DARK_BG,
      "--opacity-surface": "0.85",
      "--opacity-field": "0.88",
      "--surface-solid-fallback": "oklch(0.18 0.04 265)",
      "--atmosphere-violet": "#a78bfa",
      "--atmosphere-teal": "#2dd4bf",
      "--atmosphere-rose": "#f472b6",
      "--atmosphere-blue": "#60a5fa",
    },
  },
})
