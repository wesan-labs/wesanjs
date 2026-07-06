/**
 * BrandIdentity — adaptif motorun çekirdeği (mimari v2 §4).
 *
 * Kritik: `domain` ENUM DEĞİL, serbest metin. Model bunun ÜZERİNDE koşullanır,
 * ÜZERİNDE dallanmaz — böylece keyfi alan (restoran, klinik, B2B…) `"other"`
 * kovasına düşmeden desteklenir. "Ezberci" tuzağının panzehiri budur.
 */

export interface BrandVoice {
  formality: number // 0 casual … 100 formal
  energy: number // 0 calm … 100 punchy
  warmth: number // 0 distant … 100 friendly
  complexity: number // 0 simple … 100 nuanced
  archetype?: string
  personaSnapshot?: string
}

export interface BrandVocabulary {
  alwaysUse?: string[]
  neverUse?: string[]
  forbiddenClaims?: string[]
}

export interface BrandVisual {
  colors: { primary: string; secondary?: string; accent?: string }
  photographyStyle?: string // "candid, natural light" vs "polished studio"
  moodKeywords?: string[] // "warm, tactile, unhurried"
  compositionAvoid?: string[]
}

export interface BrandIdentity {
  id: string
  tenantId: string
  version: number

  name: string
  tagline?: string
  domain: string // SERBEST METİN — "artisan coffee roastery" | "pediatric dental clinic"
  offering: string // ne satılıyor — compile'da {SUBJECT} default'u
  audience: string // kime — {AUDIENCE}
  positioning?: string

  voice: BrandVoice
  vocabulary?: BrandVocabulary
  visual: BrandVisual
}
