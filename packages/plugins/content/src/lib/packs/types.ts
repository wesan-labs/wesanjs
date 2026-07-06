/**
 * Pack & Template Engine tipleri (mimari spec §3, §4.1, §6).
 *
 * Çekirdek fikir: görsel talimatı LLM YAZMAZ; deterministik `fillTemplate`
 * HESAPLAR. Token'lar (`{COLOR}` gibi) resolver fonksiyonlarına bağlanır;
 * aynı metadata → byte-identical instruction.
 */

/** Bir çekim tipi (lifestyle / angle / detail / usage). */
export interface ShotDef {
  label: string
  /** "transform" yüklenen referans görseli düzenler; "generate" sıfırdan üretir. */
  mode: "transform" | "generate"
  /** UI/style için oran (4:3, 1:1, 16:9). Template metninde de gömülü olabilir. */
  aspect: string
  /** {TOKEN}'lı ham template — global fidelity prefix'i İÇERMEZ (engine ekler). */
  template: string
}

/** Ürün/içerik tipi (zigon, kanepe…). Prompt mantığını belirler. */
export interface CategoryDef {
  label: string
  /** Kategori-başına STRICT IDENTITY bloğu (global'den sonra eklenir); yoksa null. */
  identity: string | null
  /** Bu kategorinin beklediği ham metadata anahtarları (color, legs, style…). */
  metadataSchema: string[]
  shots: Record<string, ShotDef>
}

export interface PackFidelity {
  /** Her instruction'ın başına eklenen sabit koruma talimatı (GLOBAL_PREFIX). */
  global: string
}

/** Bir sektör/mağaza paketi — küratörlü üretim kurallarının tamamı. */
export interface PackDef {
  id: string
  version: string
  sector: string
  label: string
  /** Bağlanacak resolver modülünün adı (ör. "furniture"). Yoksa direkt token. */
  resolverSet?: string
  fidelity: PackFidelity
  /** Token fallback'leri — resolver yoksa hataya düşmeden önce son çare. */
  defaults?: Record<string, string>
  categories: Record<string, CategoryDef>
}

/** Bir token'ı metadata'dan zengin görsel diline çeviren saf fonksiyon. */
export type Resolver = (metadata: Record<string, string>) => string
/** TOKEN adı → resolver. Ör. `{ COLOR: (m) => colorShort[m.color] || m.color }`. */
export type ResolverSet = Record<string, Resolver>

export interface FillInput {
  packId: string
  categoryId: string
  shotId: string
  /** catalog satırı + brand + vision analiz alanları (düz key-value). */
  metadata: Record<string, string>
  style?: { aspect?: string; concept?: string }
}

export interface FillOutput {
  /** Gemini'ye giden tek metin (deterministik). */
  instruction: string
  mode: "transform" | "generate"
  meta: {
    packId: string
    categoryId: string
    shotId: string
    templateVersion: string
  }
}

/** Compose sırasında çözülemeyen token / bilinmeyen pack için fırlatılır. */
export class ComposeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ComposeError"
  }
}
