/**
 * Dribbble-grade reference palette — Bento + Aurora hybrid dashboard (2025–2026).
 * Source: modular SaaS dashboards (Linear, Vercel, Diagram-style bento grids).
 */

export const REF = {
  cream: "#F9F8F3",
  creamDeep: "#F0EDE6",
  white: "#FFFFFF",
  chrome: "#121212",
  chromeHover: "#1A1A1E",
  chromePressed: "#222228",
  violet: "#9D7BFF",
  violetHover: "#8B65F0",
  violetDeep: "#7C5CE8",
  /** WCAG AA on white text for buttons / interactive fills. */
  violetInteractive: "#6D4ED8",
  violetInteractiveHover: "#5C3FC8",
  ink: "#0A0A0A",
  inkMuted: "#666666",
  inkSubtle: "#8A8A8A",
  borderHairline: "rgba(0, 0, 0, 0.10)",
  borderHairlineStrong: "rgba(18, 18, 18, 0.18)",
  shadowCard:
    "0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)",
  shadowCardMd:
    "0 2px 4px rgba(0, 0, 0, 0.05), 0 12px 32px rgba(0, 0, 0, 0.08)",
  shadowCardLg:
    "0 4px 8px rgba(0, 0, 0, 0.06), 0 20px 48px rgba(0, 0, 0, 0.10)",
  radiusLg: "20px",
  radiusMd: "16px",
  success: "#3D9A6A",
  successMuted: "#D8F0E4",
  danger: "#E85D4C",
  dangerMuted: "#FCE8E5",
  warning: "#D4A017",
} as const

/** Grainy aurora mesh — profile cards, liquid-glass backdrop. */
export const AURORA_MESH_LIGHT = [
  "radial-gradient(80% 60% at 18% 8%, rgba(157, 123, 255, 0.50), transparent 55%)",
  "radial-gradient(70% 55% at 88% 12%, rgba(255, 154, 162, 0.42), transparent 52%)",
  "radial-gradient(65% 50% at 72% 92%, rgba(255, 200, 120, 0.38), transparent 55%)",
  "radial-gradient(55% 45% at 12% 88%, rgba(140, 180, 255, 0.32), transparent 50%)",
  REF.cream,
].join(", ")

export const AURORA_MESH_DARK = [
  "radial-gradient(70% 55% at 15% 10%, rgba(124, 92, 232, 0.35), transparent 58%)",
  "radial-gradient(60% 50% at 85% 8%, rgba(45, 212, 191, 0.22), transparent 55%)",
  "radial-gradient(65% 55% at 80% 90%, rgba(244, 114, 182, 0.28), transparent 58%)",
  "radial-gradient(50% 45% at 20% 95%, rgba(96, 165, 250, 0.20), transparent 52%)",
  "#0C0C10",
].join(", ")

/** Dark sidebar chrome — remapped inside [data-glass-chrome] via plugin. */
export const CHROME_DARK_LIGHT = {
  "--chrome-bg": REF.chrome,
  "--chrome-bg-hover": REF.chromeHover,
  "--chrome-bg-pressed": REF.chromePressed,
  "--chrome-surface": REF.violet,
  "--chrome-surface-hover": REF.violetHover,
  "--chrome-fg": "#FFFFFF",
  "--chrome-fg-muted": "rgba(255, 255, 255, 0.62)",
  "--chrome-fg-subtle": "rgba(255, 255, 255, 0.42)",
  "--chrome-border": "rgba(255, 255, 255, 0.08)",
  "--chrome-accent": REF.violet,
} as const

export const CHROME_DARK_DARK = {
  "--chrome-bg": "#0A0A0C",
  "--chrome-bg-hover": "#121216",
  "--chrome-bg-pressed": "#1A1A20",
  "--chrome-surface": REF.violet,
  "--chrome-surface-hover": REF.violetHover,
  "--chrome-fg": "#F4F4F5",
  "--chrome-fg-muted": "rgba(244, 244, 245, 0.58)",
  "--chrome-fg-subtle": "rgba(244, 244, 245, 0.38)",
  "--chrome-border": "rgba(255, 255, 255, 0.06)",
  "--chrome-accent": REF.violet,
} as const
