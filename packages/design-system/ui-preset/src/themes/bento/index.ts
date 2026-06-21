import type { ThemeDefinition } from "../types"

// Refs: Apple product pages, Linear, Vercel/MagicUI. Hierarchy = recessed
// --bg-base vs raised --bg-component (luminance step). 16:1 / 15.8:1 on card.
// Dark leans on border over shadow.
export const bento: ThemeDefinition = {
  name: "bento",
  label: "Bento Box",
  light: {
    "--bg-base": "#f4f4f5",
    "--bg-subtle": "#ebebed",
    "--bg-component": "#ffffff",
    "--bg-component-hover": "#fafafa",
    "--fg-base": "#18181b",
    "--fg-muted": "#52525b",
    "--fg-subtle": "#71717a",
    "--border-base": "#e4e4e7",
    "--border-strong": "#d4d4d8",
    "--bg-interactive": "#4f46e5",
    "--fg-interactive": "#4f46e5",
    "--fg-on-color": "#ffffff",
    "--background": "#f4f4f5",
    "--surface": "#ffffff",
    "--primary": "#4f46e5",
    "--secondary": "#ebebed",
    "--text": "#18181b",
    "--border": "#e4e4e7",
    "--radius": "24px",
    "--border-width": "1px",
    "--shadow":
      "0 1px 2px rgba(24, 24, 27, 0.06), 0 8px 24px rgba(24, 24, 27, 0.08)",
    "--shadow-pressed":
      "inset 0 1px 2px rgba(24, 24, 27, 0.10), 0 1px 1px rgba(24, 24, 27, 0.04)",
    "--blur": "12px",
    "--glow": "0 0 0 4px rgba(79, 70, 229, 0.15)",
    "--opacity-surface": "1",
    "--gap": "16px",
  },
  dark: {
    "--bg-base": "#0a0a0b",
    "--bg-subtle": "#131316",
    "--bg-component": "#18181b",
    "--bg-component-hover": "#212126",
    "--fg-base": "#fafafa",
    "--fg-muted": "#a1a1aa",
    "--fg-subtle": "#71717a",
    "--border-base": "#27272a",
    "--border-strong": "#3f3f46",
    "--bg-interactive": "#6366f1",
    "--fg-interactive": "#a5b4fc",
    "--fg-on-color": "#ffffff",
    "--background": "#0a0a0b",
    "--surface": "#18181b",
    "--primary": "#6366f1",
    "--secondary": "#27272a",
    "--text": "#fafafa",
    "--border": "#27272a",
    "--radius": "24px",
    "--border-width": "1px",
    "--shadow":
      "0 1px 2px rgba(0, 0, 0, 0.40), 0 8px 24px rgba(0, 0, 0, 0.50)",
    "--shadow-pressed":
      "inset 0 1px 2px rgba(0, 0, 0, 0.50), 0 1px 1px rgba(0, 0, 0, 0.30)",
    "--blur": "12px",
    "--glow": "0 0 0 4px rgba(99, 102, 241, 0.25)",
    "--opacity-surface": "1",
    "--gap": "16px",
  },
}
