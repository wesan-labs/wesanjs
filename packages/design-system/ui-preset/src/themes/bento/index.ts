import { defineTheme } from "../build-tokens"

const BENTO_EXTRA_LIGHT = {
  "--gap": "16px",
  "--tile-padding": "24px",
  "--tile-padding-compact": "16px",
  "--section-gap": "32px",
  "--shadow-interactive":
    "0 2px 4px rgba(24, 24, 27, 0.06), 0 12px 32px rgba(24, 24, 27, 0.1)",
  "--duration-fast": "150ms",
  "--duration-normal": "200ms",
  "--ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "--space-4": "16px",
}

const BENTO_EXTRA_DARK = {
  "--gap": "16px",
  "--tile-padding": "24px",
  "--tile-padding-compact": "16px",
  "--section-gap": "32px",
  "--shadow-interactive":
    "0 2px 4px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.45)",
  "--duration-fast": "150ms",
  "--duration-normal": "200ms",
  "--ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "--space-4": "16px",
}

export const bento = defineTheme({
  name: "bento",
  label: "Bento Box",
  light: {
    palette: {
      canvas: "#d8dae3",
      surface: "#e8eaef",
      elevated: "#ffffff",
      field: "#ffffff",
      text: "#111118",
      textMuted: "#45455a",
      textSubtle: "#63637a",
      accent: "#3730d4",
      accentFg: "#3128c8",
      onAccent: "#ffffff",
      border: "#e4e4e7",
      borderStrong: "#d4d4d8",
      borderStyle: "soft",
      radius: "22px",
      borderWidth: "1px",
      shadow:
        "0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 28px rgba(24, 24, 27, 0.08)",
      shadowSm:
        "0 1px 2px rgba(24, 24, 27, 0.04), 0 4px 12px rgba(24, 24, 27, 0.06)",
      shadowMd:
        "0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 28px rgba(24, 24, 27, 0.08)",
      shadowLg:
        "0 2px 4px rgba(24, 24, 27, 0.06), 0 16px 40px rgba(24, 24, 27, 0.12)",
      shadowPressed:
        "inset 0 1px 2px rgba(24, 24, 27, 0.08), 0 2px 4px rgba(24, 24, 27, 0.04)",
      blur: "12px",
      glow: "0 0 0 4px rgba(79, 70, 229, 0.12)",
      focusRing: "3px solid #4f46e5",
      focusRingOffset: "2px",
    },
    extra: BENTO_EXTRA_LIGHT,
  },
  dark: {
    palette: {
      canvas: "#09090b",
      surface: "#111113",
      elevated: "#18181b",
      field: "#141416",
      text: "#fafafa",
      textMuted: "#a1a1aa",
      textSubtle: "#71717a",
      accent: "#5b58e8",
      accentFg: "#a5b4fc",
      onAccent: "#ffffff",
      border: "#27272a",
      borderStrong: "#3f3f46",
      borderStyle: "soft",
      radius: "22px",
      borderWidth: "1px",
      shadow:
        "0 1px 2px rgba(0, 0, 0, 0.45), 0 10px 28px rgba(0, 0, 0, 0.55)",
      shadowSm:
        "0 1px 2px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.4)",
      shadowMd:
        "0 1px 2px rgba(0, 0, 0, 0.45), 0 10px 28px rgba(0, 0, 0, 0.55)",
      shadowLg:
        "0 2px 4px rgba(0, 0, 0, 0.5), 0 16px 40px rgba(0, 0, 0, 0.6)",
      shadowPressed:
        "inset 0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)",
      blur: "12px",
      glow: "0 0 0 4px rgba(99, 102, 241, 0.22)",
      focusRing: "3px solid #818cf8",
      focusRingOffset: "2px",
    },
    extra: BENTO_EXTRA_DARK,
  },
})
