/**
 * Theme picker metadata — auto-generated. Regenerate: yarn generate:tweakcn
 */
export type ThemeStyleOption = {
  value: string
  label: string
}

export type ThemeStyleGroup = {
  label: string
  options: readonly ThemeStyleOption[]
}

export const THEME_STYLE_GROUPS: readonly ThemeStyleGroup[] = [
  {
    label: "Professional",
    options: [
      { value: "default", label: "Default" },
      { value: "modern-minimal", label: "Modern Minimal" },
      { value: "graphite", label: "Graphite" },
      { value: "vercel", label: "Vercel" },
      { value: "claude", label: "Claude" },
    ],
  },
  {
    label: "Expressive",
    options: [
      { value: "catppuccin", label: "Catppuccin" },
      { value: "ocean-breeze", label: "Ocean Breeze" },
      { value: "midnight-bloom", label: "Midnight Bloom" },
      { value: "neo-brutalism", label: "Neo Brutalism" },
    ],
  },
]

export const THEME_STYLES: readonly ThemeStyleOption[] = THEME_STYLE_GROUPS.flatMap(
  (group) => group.options
)

export type ThemeStyle =
  | "default"
  | "modern-minimal"
  | "graphite"
  | "vercel"
  | "claude"
  | "catppuccin"
  | "ocean-breeze"
  | "midnight-bloom"
  | "neo-brutalism"
