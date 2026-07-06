/**
 * Deterministik template engine (mimari spec §4.1).
 *
 * `composeInstruction` nihai görsel talimatını HESAPLAR — LLM yazmaz. Aynı
 * (pack, category, shot, metadata) → byte-identical instruction. Bu, tüm
 * Pack Engine tezidir (spec §11: template = aynı input → aynı prompt).
 */

import {
  ComposeError,
  type FillInput,
  type FillOutput,
  type PackDef,
  type ResolverSet,
} from "./types"

// Token'lar UPPERCASE + underscore: {COLOR}, {SOFA_COLOR}, {FABRIC_DESC}…
const TOKEN_RE = /\{([A-Z0-9_]+)\}/g

/**
 * Bir token'ı çöz. Öncelik: metadata direct override → resolver → pack default
 * → HATA. Sessiz example fallback YOK (spec §4.1 kural 2) — determinizmi ve
 * fidelity'yi bozacak "uydurma" değeri engeller.
 * Time: O(1) per token.
 */
const resolveToken = (
  token: string,
  metadata: Record<string, string>,
  resolverSet: ResolverSet,
  defaults?: Record<string, string>
): string => {
  const override = metadata[token]
  if (override != null && String(override).trim() !== "") return String(override)

  // Resolver boş/undefined dönebilir (ham metadata eksik) → sessiz "undefined"
  // string'i basma; default'a, o da yoksa hataya düş.
  const resolver = resolverSet[token]
  if (resolver) {
    const resolved = resolver(metadata)
    if (resolved != null && String(resolved).trim() !== "") return String(resolved)
  }

  const fallback = defaults?.[token]
  if (fallback != null && String(fallback).trim() !== "") return String(fallback)

  throw new ComposeError(`Unresolved token {${token}} (no metadata, resolver, or pack default)`)
}

/**
 * Template'teki tüm {TOKEN}'ları çöz. Time: O(m) template uzunluğu üzerinde
 * (regex tek geçiş), her token O(1).
 */
const fill = (
  template: string,
  metadata: Record<string, string>,
  resolverSet: ResolverSet,
  defaults?: Record<string, string>
): string =>
  template.replace(TOKEN_RE, (_, token: string) =>
    resolveToken(token, metadata, resolverSet, defaults)
  )

/**
 * Curated UI kontrollerinden (aspect + concept) ek talimat. Kullanıcı SEÇER,
 * yazmaz; brief'teki çakışan --ar/style'ı override eder. `prompt-library.ts`
 * `styleDirective` ile aynı sözleşme — determinizm korunur (saf).
 */
const styleDirective = (style?: FillInput["style"]): string => {
  if (!style) return ""
  const bits: string[] = []
  if (style.aspect) bits.push(`composition/aspect: ${style.aspect}`)
  if (style.concept) bits.push(`visual concept & cultural aesthetic: ${style.concept}`)
  return bits.length
    ? ` Additionally you MUST apply these (override any conflicting --ar/style in the brief): ${bits.join("; ")}.`
    : ""
}

/**
 * Ana giriş: metadata → deterministik instruction. Sıra:
 * fidelity.global → category.identity (varsa) → shot template → style directive.
 * Time: O(m). Space: O(m).
 */
export const composeInstruction = (
  input: FillInput,
  pack: PackDef,
  resolverSet: ResolverSet
): FillOutput => {
  const category = pack.categories[input.categoryId]
  if (!category) {
    throw new ComposeError(`Unknown category "${input.categoryId}" in pack "${pack.id}"`)
  }
  const shot = category.shots[input.shotId]
  if (!shot) {
    throw new ComposeError(
      `Unknown shot "${input.shotId}" in category "${input.categoryId}"`
    )
  }

  const parts: string[] = [pack.fidelity.global]
  if (category.identity) {
    parts.push(fill(category.identity, input.metadata, resolverSet, pack.defaults))
  }
  parts.push(fill(shot.template, input.metadata, resolverSet, pack.defaults))

  const instruction = parts.join(" ") + styleDirective(input.style)

  return {
    instruction,
    mode: shot.mode,
    meta: {
      packId: pack.id,
      categoryId: input.categoryId,
      shotId: input.shotId,
      templateVersion: pack.version,
    },
  }
}
