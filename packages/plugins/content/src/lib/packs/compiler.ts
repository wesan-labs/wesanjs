/**
 * L1 Pack Derleyici (mimari v2 §2, §5) — `BrandIdentity` → donmuş PackDef.
 *
 * ÇEKİRDEK TEZ: LLM her istekte oturmaz; markayı bir kez pack'e DERLER, pack
 * dondurulur, sonra hot-path (composeInstruction) onu ~0ms deterministik çalıştırır.
 * Bega'nın elle-yazdığı pack = bu derleyicinin `provenance:"human-tuned"` özel hali.
 *
 * Bu dosya kural-tabanlı BASELINE derleyicidir: LLM'siz, kredisiz, %100 deterministik
 * — markayı intent taksonomisine bağlar. LLM zenginleştirmesi opsiyonel bir SEAM'dir
 * (aşağıda `enrich`): structured-output + Zod ile daha zengin vocabulary/şablon üretir,
 * ama çekirdek determinizm + fidelity garantisi baseline'da zaten sağlanır.
 */

import { INTENTS } from "../brand/intents"
import type { BrandIdentity } from "../brand/types"
import type { CategoryDef, PackDef, ShotDef } from "./types"

/** Markayı görsel fidelity/style prefix'ine bak — deterministik, saf. */
const brandFidelity = (brand: BrandIdentity): string => {
  const { colors, photographyStyle, moodKeywords, compositionAvoid } = brand.visual
  const palette = [colors.primary, colors.secondary, colors.accent]
    .filter(Boolean)
    .join(", ")
  const mood = moodKeywords?.length ? `mood: ${moodKeywords.join(", ")}. ` : ""
  const photo = photographyStyle ? `${photographyStyle}. ` : ""
  const avoid = [
    ...(compositionAvoid ?? []),
    ...(brand.vocabulary?.neverUse ?? []),
  ]
  const avoidLine = avoid.length ? `Avoid: ${avoid.join("; ")}. ` : ""
  const position = brand.positioning ? `${brand.positioning}. ` : ""

  return (
    `BRAND FIDELITY — stay true to ${brand.name}'s visual identity: ` +
    `palette ${palette}. ${photo}${mood}${position}${avoidLine}` +
    `Preserve the exact identity, proportions and true colors of any provided ` +
    `reference image; do not distort or recolor the product.`
  )
}

/** Intent'leri bu markanın shot'larına çevir. */
const shotsFromIntents = (): Record<string, ShotDef> =>
  Object.fromEntries(
    INTENTS.map((i) => [
      i.id,
      { label: i.label, mode: i.mode, aspect: i.aspect, template: i.template },
    ])
  )

/**
 * Markayı deterministik bir PackDef'e derle. Aynı marka (aynı version) → aynı pack.
 * Sektöre HARDCODE yok — `domain` üzerinde koşullanır: kahve kavurucusu, diş kliniği,
 * B2B SaaS aynı derleyiciden geçer, kimse dikey-özel şablon yazmaz.
 * Time: O(intent sayısı). Space: O(intent sayısı).
 */
export const compilePack = (brand: BrandIdentity): PackDef => {
  const category: CategoryDef = {
    label: brand.offering,
    identity: null,
    // Templates yalnız generik slot kullanır; SUBJECT/AUDIENCE vision + marka doldurur.
    metadataSchema: ["SUBJECT", "AUDIENCE"],
    shots: shotsFromIntents(),
  }

  return {
    id: `brand-${brand.id}`,
    version: `${brand.version}.0.0`,
    sector: brand.domain, // serbest metin — enum değil
    label: brand.name,
    fidelity: { global: brandFidelity(brand) },
    // Vision doldurmazsa marka değerleri düşer (sessiz "undefined" yerine anlamlı default).
    defaults: { SUBJECT: brand.offering, AUDIENCE: brand.audience },
    categories: { main: category },
  }
}

/**
 * LLM zenginleştirme SEAM'i (opsiyonel, sonra). Structured-output + Zod ile
 * markaya özel vocabulary/daha zengin şablonlar üretir; başarısız/kredisiz ise
 * baseline pack aynen kullanılır. İmza kasıtlı olarak baseline ile aynı şekli döner.
 */
export type PackEnricher = (
  brand: BrandIdentity,
  baseline: PackDef
) => Promise<PackDef>
