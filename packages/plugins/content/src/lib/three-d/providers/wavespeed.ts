import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"
import type { TaskStatus } from "../types"

// ③ SeedVR2 (video upscale/restorasyon) — WaveSpeed üzerinden (fal DEĞİL).
// Sözleşme doğrulandı: api.wavespeed.ai · 2026-07-08 (spec §5).
const BASE = "https://api.wavespeed.ai/api/v3"
const SUBMIT_URL = `${BASE}/wavespeed-ai/video-upscaler`
const TARGET = "4k" // 720p|1080p|2k|4k

/** WaveSpeed durum → iç TaskStatus. Saf. */
export const mapWaveSpeedStatus = (s: string): TaskStatus =>
  s === "completed" ? "ready" : s === "created" || s === "processing" ? "processing" : "failed"

/** StepInput → video-upscaler gövdesi. sourceUrl = orbital mp4. Saf. */
export const toUpscaleBody = (input: StepInput): Record<string, unknown> => ({
  video: input.sourceUrl,
  target_resolution: TARGET,
})

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/** ③ WaveSpeed SeedVR upscale adımı. submit→data.id, poll→data.outputs[0]. Canlı fetch — key-gated. */
export const createSeedvrUpscaleStep = (apiKey: string): PipelineModelStep => ({
  name: "seedvr2",
  step: "upscale",
  async submit(input: StepInput): Promise<StepJob> {
    const res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(toUpscaleBody(input)),
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
