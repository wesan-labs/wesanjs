import type { PipelineModelStep, StepInput } from "./pipeline"
import { createBflHeroStep } from "./providers/bfl"
import { createSeedanceOrbitalStep } from "./providers/byteplus"
import { createSeedvrUpscaleStep } from "./providers/wavespeed"

/** Model adımı → (env key adı + adaptör fabrikası). fal YOK. */
const REGISTRY: Record<string, { envKey: string; make: (key: string) => PipelineModelStep }> = {
  hero: { envKey: "BFL_API_KEY", make: createBflHeroStep },
  orbital: { envKey: "ARK_API_KEY", make: createSeedanceOrbitalStep },
  upscale: { envKey: "WAVESPEED_API_KEY", make: createSeedvrUpscaleStep },
}

/** Adım için gereken env key adı (UI'da "hangi key eksik" göstermek için). Saf. */
export const envKeyFor = (step: string): string | null => REGISTRY[step]?.envKey ?? null

/** Adımın adaptörünü env key ile kur; key yoksa null (pipeline bekler). */
export const resolveStep = (step: string, env: NodeJS.ProcessEnv = process.env): PipelineModelStep | null => {
  const entry = REGISTRY[step]
  if (!entry) return null
  const key = env[entry.envKey]
  return key ? entry.make(key) : null
}

/** Varlık için kaynak alt küme (stepInputFor girdisi). */
export interface AssetInputView {
  inputs: string[]
  hero_url?: string | null
  video_url?: string | null
  brand_hex?: string | null
}

/**
 * Adım için `StepInput` üret. hero: ürün foto[0]=source, kalanı ref. orbital:
 * hero=source, ürün foto'ları=kimlik ref. upscale: orbital video=source. Saf.
 */
export const stepInputFor = (step: string, a: AssetInputView): StepInput => {
  switch (step) {
    case "hero":
      return { sourceUrl: a.inputs[0], refs: a.inputs.slice(1), brandHex: a.brand_hex ?? undefined }
    case "orbital":
      return { sourceUrl: a.hero_url ?? "", refs: a.inputs }
    case "upscale":
      return { sourceUrl: a.video_url ?? "" }
    default:
      return { sourceUrl: "" }
  }
}

/** Adım çıktısının yazılacağı kolon. hero→hero_url, orbital/upscale→video_url. Saf. */
export const outputColumnFor = (step: string): "hero_url" | "video_url" | null =>
  step === "hero" ? "hero_url" : step === "orbital" || step === "upscale" ? "video_url" : null
