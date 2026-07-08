import type { PipelineModelStep, StepInput } from "./pipeline"
import { OPERATIONS, type PipelineStepDescriptor, type StepConfig } from "./pipeline-def"
import { createBflHeroStep } from "./providers/bfl"
import { createSeedanceOrbitalStep } from "./providers/byteplus"
import { createSeedvrUpscaleStep } from "./providers/wavespeed"

/** Provider → (env key + adaptör fabrikası). fal YOK. */
const PROVIDERS: Record<string, { envKey: string; make: (key: string, cfg: StepConfig) => PipelineModelStep }> = {
  bfl: { envKey: "BFL_API_KEY", make: createBflHeroStep },
  byteplus: { envKey: "ARK_API_KEY", make: createSeedanceOrbitalStep },
  wavespeed: { envKey: "WAVESPEED_API_KEY", make: createSeedvrUpscaleStep },
}

/** Provider için gereken env key adı (UI "hangi key eksik" için). Saf. */
export const envKeyFor = (provider: string): string | null => PROVIDERS[provider]?.envKey ?? null

/** Descriptor'dan adaptörü kur: opSpec op-kaydından, params descriptor'dan. Key yoksa null. */
export const resolveStep = (
  d: PipelineStepDescriptor,
  env: NodeJS.ProcessEnv = process.env
): PipelineModelStep | null => {
  const entry = PROVIDERS[d.provider]
  if (!entry) return null
  const key = env[entry.envKey]
  if (!key) return null
  const opSpec = OPERATIONS[d.op]?.opSpec ?? null
  return entry.make(key, { opSpec, params: d.params })
}

/** Varlık için kaynak alt küme (stepInputFor girdisi). */
export interface AssetInputView {
  inputs: string[]
  hero_url?: string | null
  video_url?: string | null
}

/**
 * Op için `StepInput` üret (SADECE kaynak+refs; op-spec/params descriptor'da).
 * hero: foto[0]=source, kalanı ref. orbital: hero=source, foto'lar=kimlik ref.
 * upscale: orbital video=source. Saf.
 */
export const stepInputFor = (op: string, a: AssetInputView): StepInput => {
  switch (op) {
    case "hero":
      return { sourceUrl: a.inputs[0], refs: a.inputs.slice(1) }
    case "orbital":
      // CANLI-KANIT (2026-07-08, seedance-1.5): first_frame + reference_image
      // KARIŞTIRILAMAZ ("cannot be mixed") → ref gönderme; kimliği hero taşır
      // (ürün fotoğrafından türedi). Seedance 2.0 Reference Cluster'da yeniden ele al.
      return { sourceUrl: a.hero_url ?? "" }
    case "upscale":
      return { sourceUrl: a.video_url ?? "" }
    default:
      return { sourceUrl: "" }
  }
}

/** Op çıktısının yazılacağı kolon. hero→hero_url, orbital/upscale→video_url. Saf. */
export const outputColumnFor = (op: string): "hero_url" | "video_url" | null =>
  op === "hero" ? "hero_url" : op === "orbital" || op === "upscale" ? "video_url" : null
