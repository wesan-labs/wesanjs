import type { PipelineModelStep, StepInput } from "../pipeline"
import { capRefs, createFalStep } from "./fal"

// ② Seedance 2.0 (ByteDance) — hero'dan identity-locked 360° orbital ürün videosu.
// "Reference Cluster" (ürün foto'ları) = kimlik kilidi → fidelity yapısal.
// NOT: fal model slug'ı varsayım — canlı bağlarken doğrula (spec §5).
const MODEL_ID = "fal-ai/bytedance/seedance/v2/image-to-video"

/** ② Orbital adımı: hero + kimlik referansları → ~10s 360° dönüş videosu. */
export const createSeedanceOrbitalStep = (apiKey: string): PipelineModelStep =>
  createFalStep(apiKey, {
    name: "seedance2",
    step: "orbital",
    modelId: MODEL_ID,
    toBody: (i: StepInput) => ({
      image_url: i.sourceUrl, // hero png = başlangıç karesi
      reference_images: capRefs(i.refs ?? []), // Reference Cluster = kimlik kilidi
      prompt: "product rotates a full 360 degrees on a turntable, camera static, seamless loop",
    }),
    fromResult: (d) => d?.video?.url,
  })
