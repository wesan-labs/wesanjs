import type { ModelStepId } from "./pipeline"

/**
 * OPERASYON KAYDI — sabit tanım (§5b). op-spec = operasyonu ADLANDIRAN sabit,
 * gizli metin ("prompt" burada; düğme DEĞİL, params'ta DEĞİL). null = prompt yok.
 * Kimlik/marka güvenilirliği yapıdan gelir (referans görseller, ayrı adım), bundan değil.
 */
export interface Operation {
  id: ModelStepId
  label: string
  opSpec: string | null
}

export const OPERATIONS: Record<ModelStepId, Operation> = {
  hero: {
    id: "hero",
    label: "Hero",
    opSpec: "clean studio product hero shot, seamless neutral background, soft studio light",
  },
  orbital: {
    id: "orbital",
    label: "360° Orbital",
    opSpec: "product rotates a full 360 degrees on a turntable, camera static, seamless loop",
  },
  upscale: { id: "upscale", label: "4K Upscale", opSpec: null },
}

/** Ayarlanabilir düğmeler — provider'a geçer (op-spec DEĞİL). */
export type StepParams = Record<string, string | number | undefined>

/** Adaptör fabrikasına geçen config: sabit op-spec + ayarlanabilir params. */
export interface StepConfig {
  opSpec: string | null
  params: StepParams
}

/** Pipeline adım descriptor'ı — DATA (op kimliği + provider + params). */
export interface PipelineStepDescriptor {
  op: ModelStepId
  provider: string
  params: StepParams
}

/** Varsayılan pipeline — lineer zincir. UI + runner bunu okur. */
export const DEFAULT_PIPELINE: PipelineStepDescriptor[] = [
  { op: "hero", provider: "bfl", params: { model: "flux-2-pro", output_format: "png" } },
  {
    // Seedance 2.0 Fast — WaveSpeed üzerinden (BytePlus paket duvarı baypas, 2026-07-09).
    // 720p seçimi bilinçli: 720p($1) + SeedVR-4K($0.25) = $1.25, direkt 4K($5)'ten 4× ucuz.
    // Alternatif (bedava test): provider "byteplus" + model seedance-1-5-pro-251215.
    op: "orbital",
    provider: "wavespeed-seedance",
    params: { resolution: "720p", aspect_ratio: "1:1", duration: 5 },
  },
  { op: "upscale", provider: "wavespeed", params: { target_resolution: "4k" } },
]

/** Pipeline'da bir op'tan sonraki op; son ise null (→ done). Saf. */
export const nextOp = (
  pipeline: PipelineStepDescriptor[],
  current: string
): PipelineStepDescriptor | null => {
  const i = pipeline.findIndex((d) => d.op === current)
  return i >= 0 && i + 1 < pipeline.length ? pipeline[i + 1] : null
}

/** Op için descriptor'ı bul. Saf. */
export const descriptorFor = (
  pipeline: PipelineStepDescriptor[],
  op: string
): PipelineStepDescriptor | undefined => pipeline.find((d) => d.op === op)
