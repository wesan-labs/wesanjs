import { modernMinimal } from "./tweakcn/modern-minimal"
import { graphite } from "./tweakcn/graphite"
import { vercel } from "./tweakcn/vercel"
import { claude } from "./tweakcn/claude"
import { catppuccin } from "./tweakcn/catppuccin"
import { oceanBreeze } from "./tweakcn/ocean-breeze"
import { midnightBloom } from "./tweakcn/midnight-bloom"
import { neoBrutalism } from "./tweakcn/neo-brutalism"

/**
 * Tweakcn themes — auto-generated. Regenerate: yarn generate:tweakcn
 */
export const tweakcnThemes = {
  modernMinimal,
  graphite,
  vercel,
  claude,
  catppuccin,
  oceanBreeze,
  midnightBloom,
  neoBrutalism,
} satisfies Record<string, import("./types").ThemeDefinition>
