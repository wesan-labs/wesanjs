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
  // ⑤ Doğrudan görsel(ler) → GLB (video dolambazı YOK). Prompt yok — geometri işi.
  reconstruct: { id: "reconstruct", label: "3D Model (GLB)", opSpec: null },
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

/**
 * Varsayılan pipeline — **GLB-direct** (2026-07-10). Video dolambacı (hero→orbital→
 * upscale) KALDIRILDI: amaç GLB'yse görsel(ler)→3D tek çağrı yeterli, gerisi (turntable,
 * açı görselleri) GLB'den ÜCRETSİZ render. Tek dış-bağımlılık = Runware (tek key).
 * Video adaptörleri (bfl/byteplus/wavespeed) registry'de duruyor — gerekirse tek satır swap.
 */
export const DEFAULT_PIPELINE: PipelineStepDescriptor[] = [
  { op: "reconstruct", provider: "runware", params: { model: "tripo:v3.1@0", outputFormat: "GLB" } },
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
