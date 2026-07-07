import type { PipelineModelStep, StepInput } from "../pipeline"
import { capRefs, createFalStep } from "./fal"

// ① FLUX.2 (Black Forest Labs) — ürün-detayı koruyan 4MP hero editör; hex marka
// rengi, arka plan/stüdyo, 10 referansa kadar multi-reference.
// NOT: fal model slug'ı varsayım — canlı bağlarken doğrula (spec §5).
const MODEL_ID = "fal-ai/flux-2"

/** ① Hero adımı: ürün foto(ları) → marka-sahne 4MP hero görseli. */
export const createFluxHeroStep = (apiKey: string): PipelineModelStep =>
  createFalStep(apiKey, {
    name: "flux2",
    step: "hero",
    modelId: MODEL_ID,
    toBody: (i: StepInput) => ({
      prompt: i.prompt ?? "clean studio product hero shot, soft light, seamless background",
      image_urls: capRefs([i.sourceUrl, ...(i.refs ?? [])]),
      ...(i.brandHex ? { brand_color: i.brandHex } : {}),
    }),
    fromResult: (d) => d?.images?.[0]?.url ?? d?.image?.url,
  })
