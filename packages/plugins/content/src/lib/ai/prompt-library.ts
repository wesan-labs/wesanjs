import libraryData from "./prompt-library.data.json"
import {
  SECTOR_PROMPTS,
  SECTOR_VARIABLES,
  SECTORS,
} from "./sector-packs"

/**
 * Loads the structured social-content prompt library (333 prompts + 8 data
 * banks) and renders {{VARIABLE}} placeholders. Each prompt keeps `system`
 * (role/persistent) and `template` (variable-injected user prompt) separate;
 * the engine fills both, then the AI layer runs them.
 */

export interface LibraryPrompt {
  id: string
  platform: string
  content_type: string
  funnel_stage: string
  tone: string
  title: string
  goal: string
  system: string
  template: string
  variables: string[]
  output: { format: string; shape: string }
  tags: string[]
  source: string
  /** vertical this prompt belongs to; "universal" = sector-neutral (text) */
  sector?: string
  /**
   * Visual prompts only: "transform" EDITS the uploaded image (keeps its content,
   * builds framing/branding around it); "generate" makes new art from scratch.
   */
  mode?: "transform" | "generate"
}

interface VariableMeta {
  type: string
  example?: string
  default?: string
  values?: string[]
  enum_example?: string[]
  description?: string
}

interface Library {
  meta: {
    platforms: string[]
    content_types: string[]
    funnel_stages: string[]
    counts: { prompts: number; data_banks: number }
  }
  variables: Record<string, VariableMeta>
  tones: Record<string, string>
  prompts: LibraryPrompt[]
  data_banks: unknown[]
}

// Imported (not readFileSync) so the JSON is bundled into the plugin build —
// __dirname-relative reads don't survive `medusa plugin:build`.
const library: Library = libraryData as unknown as Library

/**
 * Derive the vertical of an existing data prompt: the whole shipped library was
 * authored for furniture e-commerce, so every visual prompt is "furniture" and
 * every text prompt is sector-neutral ("universal"). Sector packs add the rest.
 */
const deriveSector = (p: LibraryPrompt): string =>
  p.content_type === "image-prompt" ? "furniture" : "universal"

// The shipped furniture visual prompts place/style the UPLOADED product photo,
// so they're "transform" (use your image), not "generate".
const deriveMode = (p: LibraryPrompt): "transform" | "generate" | undefined =>
  p.content_type === "image-prompt" ? "transform" : undefined

// Merge: shipped prompts (sector + mode derived) + the new sector packs.
const PROMPTS: LibraryPrompt[] = [
  ...library.prompts.map((p) => ({
    ...p,
    sector: p.sector ?? deriveSector(p),
    mode: p.mode ?? deriveMode(p),
  })),
  ...SECTOR_PROMPTS,
]

const VARIABLES: Record<string, VariableMeta> = {
  ...library.variables,
  ...SECTOR_VARIABLES,
}

const BY_ID = new Map(PROMPTS.map((p) => [p.id, p]))

/** Slim shape for browsing — omits heavy system/template bodies. */
export interface PromptListItem {
  id: string
  platform: string
  content_type: string
  funnel_stage: string
  tone: string
  sector: string
  mode: "transform" | "generate"
  title: string
  goal: string
  /** raw template (with {{VARIABLE}} tokens) so the UI can preview the prompt */
  template: string
  output: { format: string; shape: string }
  variables: string[]
  tags: string[]
}

export interface PromptFilters {
  platform?: string
  content_type?: string
  funnel_stage?: string
  tone?: string
  /** vertical; matches the prompt's sector OR universal (neutral text) */
  sector?: string
  q?: string
  limit?: number
  offset?: number
}

const toListItem = (p: LibraryPrompt): PromptListItem => ({
  id: p.id,
  platform: p.platform,
  content_type: p.content_type,
  funnel_stage: p.funnel_stage,
  tone: p.tone,
  sector: p.sector ?? "universal",
  mode: p.mode ?? "generate",
  title: p.title,
  goal: p.goal,
  template: p.template,
  output: p.output,
  variables: p.variables,
  tags: p.tags,
})

/**
 * Filter + paginate prompts. Time: O(n) over 333 prompts — trivial; kept linear
 * for simplicity rather than pre-indexing every facet.
 */
export const listPrompts = (
  filters: PromptFilters = {}
): { prompts: PromptListItem[]; count: number } => {
  const q = filters.q?.toLowerCase().trim()
  const matched = PROMPTS.filter((p) => {
    if (filters.platform && p.platform !== filters.platform) return false
    if (filters.content_type && p.content_type !== filters.content_type) return false
    if (filters.funnel_stage && p.funnel_stage !== filters.funnel_stage) return false
    if (filters.tone && p.tone !== filters.tone) return false
    if (
      filters.sector &&
      p.sector !== filters.sector &&
      p.sector !== "universal"
    )
      return false
    if (q) {
      const hay = `${p.title} ${p.goal} ${p.tags.join(" ")}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 50
  return {
    count: matched.length,
    prompts: matched.slice(offset, offset + limit).map(toListItem),
  }
}

export const getPrompt = (id: string): LibraryPrompt | undefined => BY_ID.get(id)

// Content types from data + any new ones added by sector packs (e.g. video-prompt).
const EXTRA_CONTENT_TYPES = Array.from(
  new Set(PROMPTS.map((p) => p.content_type))
).filter((t) => !library.meta.content_types.includes(t))

/** Facets + variable metadata + tones + sectors for building the UI. */
export const getLibraryMeta = () => ({
  platforms: library.meta.platforms,
  content_types: [...library.meta.content_types, ...EXTRA_CONTENT_TYPES],
  funnel_stages: library.meta.funnel_stages,
  tones: library.tones,
  sectors: SECTORS,
  variables: VARIABLES,
  counts: { ...library.meta.counts, prompts: PROMPTS.length },
})

/**
 * Replace {{VAR}} tokens with user values; fall back to the variable's example
 * /default so a partially-filled form still produces a coherent prompt.
 * Time: O(m) over the text length.
 */
const fill = (text: string, vars: Record<string, string>): string =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const provided = vars[key]
    if (provided != null && String(provided).trim() !== "") return String(provided)
    const meta = VARIABLES[key]
    return meta?.example ?? meta?.default ?? ""
  })

export const renderPrompt = (
  prompt: LibraryPrompt,
  vars: Record<string, string>
): { system: string; template: string } => ({
  system: fill(prompt.system, vars),
  template: fill(prompt.template, vars),
})

/**
 * Build an extra image instruction from the curated UI controls (aspect ratio +
 * cultural concept). These are SELECTED by the user, not typed, and override any
 * conflicting --ar/style baked into the prompt brief.
 */
export const styleDirective = (vars?: Record<string, string>): string => {
  if (!vars) return ""
  const bits: string[] = []
  if (vars.ASPECT) bits.push(`composition/aspect: ${vars.ASPECT}`)
  if (vars.CONCEPT) bits.push(`visual concept & cultural aesthetic: ${vars.CONCEPT}`)
  return bits.length
    ? ` Additionally you MUST apply these (override any conflicting --ar/style in the brief): ${bits.join("; ")}.`
    : ""
}
