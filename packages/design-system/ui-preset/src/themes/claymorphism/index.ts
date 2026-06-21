import type { ThemeDefinition } from "../types"

// Refs: hype4/Malewicz claymorphism.com, clay.css (Adrian Bece), Smashing.
// Puffy = large outer drop + top-inner light highlight + bottom-inner dark.
// Dark: highlight alpha 0.45 -> ~0.12 (white inset blows out on dark).
// Contrast on clay surface: 7.9:1 (light) / 9.6:1 (dark). Border 0.
export const claymorphism: ThemeDefinition = {
  name: "claymorphism",
  label: "Claymorphism",
  light: {
    "--bg-base": "#efe9ff",
    "--bg-subtle": "#e7e0fb",
    "--bg-component": "#cfc6f5",
    "--bg-component-hover": "#c4b9f2",
    "--fg-base": "#312562",
    "--fg-muted": "#5a4fa0",
    "--fg-subtle": "#8a80c4",
    "--border-base": "rgba(91, 74, 224, 0.14)",
    "--border-strong": "rgba(91, 74, 224, 0.28)",
    "--bg-interactive": "#5b4ae0",
    "--fg-interactive": "#5b4ae0",
    "--fg-on-color": "#ffffff",
    "--background": "#efe9ff",
    "--surface": "#cfc6f5",
    "--primary": "#5b4ae0",
    "--secondary": "#f7a8c4",
    "--text": "#312562",
    "--border": "rgba(91, 74, 224, 0.14)",
    "--radius": "32px",
    "--border-width": "0",
    "--shadow":
      "16px 18px 36px rgba(76, 58, 160, 0.30), inset 8px 10px 16px rgba(255, 255, 255, 0.55), inset -8px -10px 18px rgba(76, 58, 160, 0.22)",
    "--shadow-pressed":
      "6px 8px 16px rgba(76, 58, 160, 0.22), inset 10px 12px 20px rgba(76, 58, 160, 0.28), inset -6px -6px 12px rgba(255, 255, 255, 0.40)",
    "--blur": "8px",
    "--glow": "0 0 24px rgba(91, 74, 224, 0.35)",
    "--opacity-surface": "1",
  },
  dark: {
    "--bg-base": "#15132b",
    "--bg-subtle": "#1d1a3a",
    "--bg-component": "#3a3568",
    "--bg-component-hover": "#453f7a",
    "--fg-base": "#f1edff",
    "--fg-muted": "#b9b2e6",
    "--fg-subtle": "#837bb8",
    "--border-base": "rgba(255, 255, 255, 0.08)",
    "--border-strong": "rgba(255, 255, 255, 0.16)",
    "--bg-interactive": "#6c5ce7",
    "--fg-interactive": "#b8aeff",
    "--fg-on-color": "#ffffff",
    "--background": "#15132b",
    "--surface": "#3a3568",
    "--primary": "#6c5ce7",
    "--secondary": "#e87da6",
    "--text": "#f1edff",
    "--border": "rgba(255, 255, 255, 0.08)",
    "--radius": "32px",
    "--border-width": "0",
    "--shadow":
      "16px 18px 40px rgba(0, 0, 0, 0.55), inset 8px 10px 16px rgba(255, 255, 255, 0.12), inset -8px -10px 20px rgba(0, 0, 0, 0.45)",
    "--shadow-pressed":
      "6px 8px 18px rgba(0, 0, 0, 0.50), inset 10px 12px 22px rgba(0, 0, 0, 0.55), inset -6px -6px 12px rgba(255, 255, 255, 0.08)",
    "--blur": "10px",
    "--glow": "0 0 28px rgba(108, 92, 231, 0.55)",
    "--opacity-surface": "1",
  },
}
