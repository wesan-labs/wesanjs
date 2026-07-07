import type { PipelineModelStep, StepInput } from "../pipeline"
import { createFalStep } from "./fal"

// ③ SeeDVR — orbital videoyu 4K'ya restore/upscale (gürültü/artefakt temizle).
// NOT: fal model slug'ı varsayım — canlı bağlarken doğrula (spec §5).
const MODEL_ID = "fal-ai/seedvr/upscale/video"

/** ③ Upscale adımı: orbital mp4 → 4K temiz mp4 (④ kare-örneklemeye hazır). */
export const createSeedvrUpscaleStep = (apiKey: string): PipelineModelStep =>
  createFalStep(apiKey, {
    name: "seedvr",
    step: "upscale",
    modelId: MODEL_ID,
    toBody: (i: StepInput) => ({ video_url: i.sourceUrl, resolution: "4k" }),
    fromResult: (d) => d?.video?.url,
  })
