/**
 * Pack loader — pack JSON'ları yükler, resolver modüllerini bağlar, tenant
 * override merge iskeleti sağlar. Tek yüksek-seviye giriş: `compose(input)`.
 *
 * NOT: Pack JSON `import` edilir (readFileSync DEĞİL) — `medusa plugin:build`
 * __dirname-relative okumaları bundle'a taşımıyor (bkz. prompt-library.ts:60).
 */

import begahomeFurniture from "./data/begahome-furniture.pack.json"
import mobileGameUa from "./data/mobile-game-ua.pack.json"
import { furnitureResolvers } from "./resolvers/furniture"
import { composeInstruction } from "./template-engine"
import {
  ComposeError,
  type FillInput,
  type FillOutput,
  type PackDef,
  type ResolverSet,
} from "./types"

// resolverSet adı → registry. Pack JSON sadece ismi referans verir (spec §6).
const RESOLVER_SETS: Record<string, ResolverSet> = {
  furniture: furnitureResolvers,
}

// furniture: resolver-türetimli (Bega). mobile-game: direct-token (resolver yok)
// — ikisi aynı engine'den geçer → engine generic, sektöre hardcode değil.
const PACKS: PackDef[] = [begahomeFurniture as PackDef, mobileGameUa as PackDef]

const BY_ID = new Map(PACKS.map((p) => [p.id, p]))

/** Pack'i id ile getir. O(1). */
export const getPack = (id: string): PackDef | undefined => BY_ID.get(id)

/** Pack'in resolver setini çöz; yoksa boş (yalnız direct-token pack'ler). O(1). */
export const getResolverSet = (pack: PackDef): ResolverSet =>
  RESOLVER_SETS[pack.resolverSet ?? ""] ?? {}

/** Facet meta: UI'nın sector → category → shot çizmesi için. O(pack·cat·shot). */
export interface PackSummary {
  id: string
  sector: string
  label: string
  categories: {
    id: string
    label: string
    /** UI'nın hangi metadata alanlarını soracağını bilmesi için (color, legs…). */
    metadataSchema: string[]
    shots: { id: string; label: string; mode: string; aspect: string }[]
  }[]
}

const toSummary = (p: PackDef): PackSummary => ({
  id: p.id,
  sector: p.sector,
  label: p.label,
  categories: Object.entries(p.categories).map(([cid, c]) => ({
    id: cid,
    label: c.label,
    metadataSchema: c.metadataSchema,
    shots: Object.entries(c.shots).map(([sid, s]) => ({
      id: sid,
      label: s.label,
      mode: s.mode,
      aspect: s.aspect,
    })),
  })),
})

export const listPacks = (): PackSummary[] => PACKS.map(toSummary)

/**
 * Tenant override merge iskeleti (spec §3.2, §5.4). Faz 1'de stub — shallow
 * merge (vocabulary/category patch). Tam iş #0014.
 */
export const mergePack = (base: PackDef, override?: Partial<PackDef>): PackDef =>
  override ? { ...base, ...override } : base

/**
 * Tek giriş noktası — API route'un çağırdığı. pack + resolver'ı çözer,
 * deterministik instruction üretir. O(m).
 */
export const compose = (input: FillInput): FillOutput => {
  const pack = getPack(input.packId)
  if (!pack) throw new ComposeError(`Unknown pack "${input.packId}"`)
  return composeInstruction(input, pack, getResolverSet(pack))
}
