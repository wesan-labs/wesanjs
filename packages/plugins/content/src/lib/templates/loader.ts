import igPostMinimal from "./data/ig-post-minimal.template.json"
import igStoryBold from "./data/ig-story-bold.template.json"
import ogWide from "./data/og-wide.template.json"
import { validateTemplate } from "./schema"
import type { Template } from "./types"

// build-time doğrulama: bozuk bir template JSON'u modül yüklenirken erken patlar
const REGISTRY: Template[] = [igPostMinimal, igStoryBold, ogWide].map((t) => validateTemplate(t))

export interface TemplateFilter {
  kind?: Template["kind"]
  format?: string
}

export const listTemplates = (filter?: TemplateFilter): Template[] =>
  REGISTRY.filter(
    (t) =>
      (!filter?.kind || t.kind === filter.kind) &&
      (!filter?.format || t.format === filter.format)
  )

export const getTemplate = (id: string): Template | undefined =>
  REGISTRY.find((t) => t.id === id)

/** Marka için öneri girdisi — BrandIdentity'nin skorlamaya yeten alt kümesi. */
export interface RecommendInput {
  domain?: string
  offering?: string
  audience?: string
}

const norm = (s?: string) => (s ?? "").toLowerCase()

// "food-beverage" → ["food-beverage", "food", "beverage"] (parçalı eşleşme)
const tagTokens = (tag: string): string[] =>
  [tag, ...tag.split("-")].map((t) => t.toLowerCase())

const scoreTemplate = (t: Template, text: string): number => {
  if (!t.domainTags?.length) return 0
  let score = 0
  for (const tag of t.domainTags) {
    if (tag.toLowerCase() === "genel") continue // her template'te var → ayırt etmez
    if (tagTokens(tag).some((tok) => tok.length > 1 && text.includes(tok))) score++
  }
  return score
}

/**
 * Markaya göre template sırala (deterministik). Skor = domain/offering/audience
 * metninde geçen domainTag sayısı; eşitlikte id'ye göre stabil sıra. Eşleşme
 * olmasa da tüm template'ler döner (galeri boş kalmaz), sadece sıra değişir.
 * Time: O(n · tag) — n küçük (kürlenmiş set). Space: O(n).
 */
export const recommendTemplates = (brand: RecommendInput): Template[] => {
  const text = [norm(brand.domain), norm(brand.offering), norm(brand.audience)].join(" ")
  return [...REGISTRY]
    .map((t) => ({ t, score: scoreTemplate(t, text) }))
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id))
    .map((x) => x.t)
}
