import type { ThemeDefinition } from "../types"

// Refs: Apple HIG Liquid Glass, Linear, IxDF. Medusa layering: page = bg-subtle,
// cards = bg-base, inputs = bg-component/field. So the GRADIENT goes to the page
// (var(--app-backdrop), applied fixed by the plugin) and bg-base/component/field
// are translucent + frosted (plugin adds backdrop-filter). Contrast measured on
// the composited surface: 12.3:1 (light) / 16.7:1 (dark).
export const glassmorphism: ThemeDefinition = {
  name: "glassmorphism",
  label: "Glassmorphism",
  frostedSurfaces: true,
  light: {
    "--app-backdrop":
      "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
    "--bg-base": "rgba(255, 255, 255, 0.72)",
    "--bg-base-hover": "rgba(255, 255, 255, 0.80)",
    "--bg-subtle": "rgba(255, 255, 255, 0.45)",
    "--bg-component": "rgba(255, 255, 255, 0.62)",
    "--bg-component-hover": "rgba(255, 255, 255, 0.72)",
    "--bg-field": "rgba(255, 255, 255, 0.55)",
    "--fg-base": "#171723",
    "--fg-muted": "#474863",
    "--fg-subtle": "#6b6d8a",
    "--border-base": "rgba(255, 255, 255, 0.55)",
    "--border-strong": "rgba(255, 255, 255, 0.80)",
    "--bg-interactive": "#4f46e5",
    "--fg-interactive": "#4338ca",
    "--fg-on-color": "#ffffff",
    "--background": "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
    "--surface": "rgba(255, 255, 255, 0.72)",
    "--primary": "#4f46e5",
    "--secondary": "#a855f7",
    "--text": "#171723",
    "--border": "rgba(255, 255, 255, 0.55)",
    "--radius": "16px",
    "--border-width": "1px",
    "--shadow":
      "0 8px 32px rgba(31, 38, 135, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.50)",
    "--shadow-pressed": "inset 0 2px 6px rgba(31, 38, 135, 0.22)",
    "--blur": "18px",
    "--glow": "0 0 24px rgba(99, 102, 241, 0.35)",
    "--opacity-surface": "0.72",
  },
  dark: {
    "--app-backdrop":
      "radial-gradient(120% 120% at 20% 0%, #1e1b4b 0%, #0f1020 55%, #050510 100%)",
    "--bg-base": "rgba(22, 24, 38, 0.62)",
    "--bg-base-hover": "rgba(28, 30, 46, 0.70)",
    "--bg-subtle": "rgba(22, 24, 38, 0.40)",
    "--bg-component": "rgba(28, 30, 46, 0.55)",
    "--bg-component-hover": "rgba(34, 36, 54, 0.65)",
    "--bg-field": "rgba(22, 24, 38, 0.48)",
    "--fg-base": "#f4f5ff",
    "--fg-muted": "#b0b6d6",
    "--fg-subtle": "#8086a8",
    "--border-base": "rgba(255, 255, 255, 0.12)",
    "--border-strong": "rgba(255, 255, 255, 0.18)",
    "--bg-interactive": "#6366f1",
    "--fg-interactive": "#a5b4fc",
    "--fg-on-color": "#14142a",
    "--background":
      "radial-gradient(120% 120% at 20% 0%, #1e1b4b 0%, #0f1020 55%, #050510 100%)",
    "--surface": "rgba(22, 24, 38, 0.62)",
    "--primary": "#818cf8",
    "--secondary": "#c084fc",
    "--text": "#f4f5ff",
    "--border": "rgba(255, 255, 255, 0.12)",
    "--radius": "16px",
    "--border-width": "1px",
    "--shadow":
      "0 8px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
    "--shadow-pressed": "inset 0 2px 6px rgba(0, 0, 0, 0.60)",
    "--blur": "20px",
    "--glow": "0 0 28px rgba(129, 140, 248, 0.40)",
    "--opacity-surface": "0.62",
  },
}
