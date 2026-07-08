import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"
import type { StepConfig, StepParams } from "../pipeline-def"
import type { TaskStatus } from "../types"

// ③ SeedVR2 (video upscale/restorasyon) — WaveSpeed üzerinden (fal DEĞİL).
// Sözleşme doğrulandı: api.wavespeed.ai · 2026-07-08 (spec §5).
const BASE = "https://api.wavespeed.ai/api/v3"
const SUBMIT_URL = `${BASE}/wavespeed-ai/video-upscaler`

/** WaveSpeed durum → iç TaskStatus. Saf. */
export const mapWaveSpeedStatus = (s: string): TaskStatus =>
  s === "completed" ? "ready" : s === "created" || s === "processing" ? "processing" : "failed"

/** StepInput + params → video-upscaler gövdesi. sourceUrl = orbital mp4; op-spec YOK. Saf. */
export const toUpscaleBody = (input: StepInput, params: StepParams): Record<string, unknown> => ({
  video: input.sourceUrl,
  target_resolution: String(params.target_resolution ?? "4k"),
})

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/** ③ WaveSpeed SeedVR upscale adımı. submit→data.id, poll→data.outputs[0]. key-gated. */
export const createSeedvrUpscaleStep = (apiKey: string, cfg: StepConfig): PipelineModelStep => ({
  name: "seedvr2",
  step: "upscale",
  async submit(input: StepInput): Promise<StepJob> {
    const res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(toUpscaleBody(input, cfg.params)),
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
