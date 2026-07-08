import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"
import type { StepConfig, StepParams } from "../pipeline-def"
import type { TaskStatus } from "../types"

// WaveSpeed adımları (fal DEĞİL): ② Seedance 2.0 Fast orbital + ③ SeedVR2 4K upscale.
// Sözleşmeler doğrulandı: api.wavespeed.ai · 2026-07-08/09 (spec §5).
const BASE = "https://api.wavespeed.ai/api/v3"

/** WaveSpeed durum → iç TaskStatus. Saf. */
export const mapWaveSpeedStatus = (s: string): TaskStatus =>
  s === "completed" ? "ready" : s === "created" || s === "processing" ? "processing" : "failed"

/** StepInput + params → video-upscaler gövdesi. sourceUrl = orbital mp4; op-spec YOK. Saf. */
export const toUpscaleBody = (input: StepInput, params: StepParams): Record<string, unknown> => ({
  video: input.sourceUrl,
  target_resolution: String(params.target_resolution ?? "4k"),
})

/**
 * StepInput + op-spec + params → Seedance 2.0 Fast i2v gövdesi (WaveSpeed).
 * Sözleşme doğrulandı 2026-07-09: `image`=başlangıç karesi (hero), `prompt`=op-spec.
 * Bu varyantta reference_image YOK (kimliği hero taşır). Fiyat: $0.50 baz(480p·5s),
 * 720p=×2, 1080p=×5, 4k=×10 → optimal: 720p + SeedVR-4K ($1.25 toplam). Saf.
 */
export const toSeedanceWsBody = (input: StepInput, opSpec: string | null, params: StepParams): Record<string, unknown> => ({
  prompt: opSpec ?? "product rotates a full 360 degrees on a turntable, camera static",
  image: input.sourceUrl,
  aspect_ratio: String(params.aspect_ratio ?? "1:1"),
  resolution: String(params.resolution ?? "720p"),
  duration: Number(params.duration ?? 5),
  generate_audio: false,
})

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/** WaveSpeed queue adımı — submit path'i değişir, poll deseni ortak (DRY). */
const createWsStep = (
  apiKey: string,
  name: string,
  step: "orbital" | "upscale",
  submitPath: string,
  toBody: (input: StepInput) => Record<string, unknown>
): PipelineModelStep => ({
  name,
  step,
  async submit(input: StepInput): Promise<StepJob> {
    const res = await fetch(`${BASE}/${submitPath}`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(toBody(input)),
    })
    const json: any = await res.json()
    const id = json?.data?.id
    if (!res.ok || !id) {
      return { jobId: "", status: "failed", error: json?.message ?? `HTTP ${res.status}` }
    }
    return { jobId: id, pollUrl: `${BASE}/predictions/${id}/result`, status: "processing" }
  },
  async poll(job: Pick<StepJob, "jobId" | "pollUrl">): Promise<StepResult> {
    const url = job.pollUrl ?? `${BASE}/predictions/${job.jobId}/result`
    const res = await fetch(url, { headers: headers(apiKey) })
    const json: any = await res.json()
    const status = mapWaveSpeedStatus(json?.data?.status ?? "failed")
    if (status !== "ready") {
      return { status, error: status === "failed" ? json?.data?.error ?? json?.message : undefined }
    }
    const outputUrl = json?.data?.outputs?.[0]
    return outputUrl ? { status: "ready", outputUrl } : { status: "failed", error: "data.outputs boş" }
  },
})

/** ② Seedance 2.0 Fast orbital (WaveSpeed) — BytePlus paket duvarını baypas eder. */
export const createSeedanceWsOrbitalStep = (apiKey: string, cfg: StepConfig): PipelineModelStep =>
  createWsStep(apiKey, "seedance-2.0-fast", "orbital", "bytedance/seedance-2.0-fast/image-to-video", (i) =>
    toSeedanceWsBody(i, cfg.opSpec, cfg.params)
  )

/** ③ WaveSpeed SeedVR upscale adımı — aynı DRY queue deseni. key-gated. */
export const createSeedvrUpscaleStep = (apiKey: string, cfg: StepConfig): PipelineModelStep =>
  createWsStep(apiKey, "seedvr2", "upscale", "wavespeed-ai/video-upscaler", (i) =>
    toUpscaleBody(i, cfg.params)
  )
