import type { ThemeDefinition } from "../types"

// Refs: Linear dark canvas, MagicUI/Aceternity aurora, Stripe CIELAB contrast.
// 4-blob radial backdrop; read text on frosted --surface, not the gradient.
// Needs backdrop-filter: blur(var(--blur)). Dark --fg-on-color is dark ink
// (white fails on the light-violet primary). Tightest text: --fg-subtle 5.0:1.
export const aurora: ThemeDefinition = {
  name: "aurora",
  label: "Aurora UI",
  light: {
    "--bg-base":
      "radial-gradient(60% 80% at 15% 10%, hsl(265 80% 88% / 0.55), transparent 60%), radial-gradient(50% 70% at 85% 15%, hsl(180 70% 85% / 0.45), transparent 55%), radial-gradient(55% 75% at 75% 90%, hsl(325 80% 90% / 0.50), transparent 60%), radial-gradient(50% 65% at 20% 95%, hsl(215 85% 88% / 0.45), transparent 55%), #f7f5fc",
    "--bg-subtle": "hsl(255 40% 97%)",
    "--bg-component": "hsl(255 50% 99% / 0.78)",
    "--bg-component-hover": "hsl(255 55% 99% / 0.90)",
    "--fg-base": "#1a1626",
    "--fg-muted": "#4a4458",
    "--fg-subtle": "#6b6478",
    "--border-base": "hsl(260 35% 88% / 0.70)",
    "--border-strong": "hsl(260 30% 78% / 0.85)",
    "--bg-interactive": "#7c3aed",
    "--fg-interactive": "#6d28d9",
    "--fg-on-color": "#ffffff",
    "--background":
      "radial-gradient(60% 80% at 15% 10%, hsl(265 80% 88% / 0.55), transparent 60%), radial-gradient(50% 70% at 85% 15%, hsl(180 70% 85% / 0.45), transparent 55%), radial-gradient(55% 75% at 75% 90%, hsl(325 80% 90% / 0.50), transparent 60%), radial-gradient(50% 65% at 20% 95%, hsl(215 85% 88% / 0.45), transparent 55%), #f7f5fc",
    "--surface": "hsl(255 50% 99% / 0.80)",
    "--primary": "#7c3aed",
    "--secondary": "#14b8a6",
    "--text": "#1a1626",
    "--border": "hsl(260 35% 88% / 0.70)",
    "--radius": "16px",
    "--border-width": "1px",
    "--shadow":
      "0 8px 24px -8px hsl(265 60% 50% / 0.18), 0 2px 8px -2px hsl(265 40% 40% / 0.10)",
    "--shadow-pressed": "inset 0 2px 6px -1px hsl(265 50% 40% / 0.20)",
    "--blur": "18px",
    "--glow":
      "0 0 40px -8px hsl(265 90% 70% / 0.16), 0 0 60px -12px hsl(180 85% 60% / 0.12), 0 0 50px -10px hsl(325 90% 72% / 0.14), 0 0 70px -16px hsl(215 95% 68% / 0.12)",
    "--opacity-surface": "0.80",
    "--neon-purple": "#9d5cf5",
    "--neon-teal": "#2dd4bf",
    "--neon-pink": "#f472b6",
    "--neon-blue": "#5b9df9",
  },
  dark: {
    "--bg-base":
      "radial-gradient(55% 75% at 12% 8%, hsl(265 75% 55% / 0.40), transparent 60%), radial-gradient(50% 70% at 88% 12%, hsl(180 70% 50% / 0.28), transparent 55%), radial-gradient(60% 80% at 80% 92%, hsl(322 80% 58% / 0.34), transparent 60%), radial-gradient(50% 65% at 18% 95%, hsl(218 85% 58% / 0.32), transparent 55%), #0a0a1a",
    "--bg-subtle": "hsl(245 35% 9%)",
    "--bg-component": "hsl(248 40% 16% / 0.72)",
    "--bg-component-hover": "hsl(248 42% 20% / 0.82)",
    "--fg-base": "#f4f2ff",
    "--fg-muted": "#b8b4d8",
    "--fg-subtle": "#8a86ae",
    "--border-base": "hsl(250 30% 35% / 0.50)",
    "--border-strong": "hsl(250 35% 50% / 0.65)",
    "--bg-interactive": "#a78bfa",
    "--fg-interactive": "#c4b5fd",
    "--fg-on-color": "#0a0a1a",
    "--background":
      "radial-gradient(55% 75% at 12% 8%, hsl(265 75% 55% / 0.40), transparent 60%), radial-gradient(50% 70% at 88% 12%, hsl(180 70% 50% / 0.28), transparent 55%), radial-gradient(60% 80% at 80% 92%, hsl(322 80% 58% / 0.34), transparent 60%), radial-gradient(50% 65% at 18% 95%, hsl(218 85% 58% / 0.32), transparent 55%), #0a0a1a",
    "--surface": "hsl(248 40% 16% / 0.72)",
    "--primary": "#a78bfa",
    "--secondary": "#2dd4bf",
    "--text": "#f4f2ff",
    "--border": "hsl(250 30% 35% / 0.50)",
    "--radius": "16px",
    "--border-width": "1px",
    "--shadow":
      "0 12px 32px -8px hsl(250 80% 6% / 0.60), 0 4px 12px -4px hsl(250 70% 4% / 0.50)",
    "--shadow-pressed": "inset 0 2px 8px -1px hsl(250 80% 4% / 0.65)",
    "--blur": "20px",
    "--glow":
      "0 0 48px -8px hsl(265 95% 68% / 0.30), 0 0 64px -12px hsl(180 90% 55% / 0.22), 0 0 56px -10px hsl(322 95% 65% / 0.26), 0 0 72px -16px hsl(218 95% 62% / 0.24)",
    "--opacity-surface": "0.72",
    "--neon-purple": "#a78bfa",
    "--neon-teal": "#2dd4bf",
    "--neon-pink": "#f472b6",
    "--neon-blue": "#60a5fa",
  },
}
