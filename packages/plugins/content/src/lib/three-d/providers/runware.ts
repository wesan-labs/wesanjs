import { randomUUID } from "node:crypto"
import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"
import type { StepConfig, StepParams } from "../pipeline-def"
import type { TaskStatus } from "../types"

// ⑤ Runware — tek-kapı sağlayıcı (image/video/3D, tek key). GLB-direct için Tripo v3.1.
// Sözleşme doğrulandı: runware.ai/docs · 2026-07-10. inputs.images data-URI kabul → hosting yok.
const API = "https://api.runware.ai/v1"

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/** Runware task durumu → iç TaskStatus. Saf. */
export const mapRunwareStatus = (s?: string): TaskStatus =>
  s === "success" ? "ready" : s === "processing" || s === "pending" ? "processing" : "failed"

/** StepInput + params → 3dInference task. images = data-URI/URL (Tripo 1–4). Saf. */
export const toReconstructTask = (input: StepInput, params: StepParams, taskUUID: string): Record<string, unknown> => ({
  taskType: "3dInference",
  taskUUID,
  deliveryMethod: "async",
  model: String(params.model ?? "tripo:v3.1@0"),
  inputs: { images: [input.sourceUrl, ...(input.refs ?? [])].filter(Boolean).slice(0, 4) },
  outputFormat: String(params.outputFormat ?? "GLB"),
})

/** Yanıttan GLB URL'i çıkar (sync veya poll sonucu). Saf. */
const glbUrl = (data: any): string | undefined => data?.outputs?.files?.[0]?.url ?? data?.outputURL

/** ⑤ Runware reconstruct — görsel(ler) → GLB. Canlı fetch — key-gated. */
export const createRunwareReconstructStep = (apiKey: string, cfg: StepConfig): PipelineModelStep => ({
  name: "tripo-v3.1",
  step: "reconstruct",
  async submit(input: StepInput): Promise<StepJob> {
    const taskUUID = randomUUID()
    const res = await fetch(API, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify([toReconstructTask(input, cfg.params, taskUUID)]),
    })
    const json: any = await res.json()
    const err = json?.errors?.[0]?.message ?? json?.error
    if (!res.ok || err) {
      return { jobId: "", status: "failed", error: err ?? `HTTP ${res.status}` }
    }
    // async → taskUUID ile poll. (sync döndüyse poll ilk turda hazır bulur.)
    return { jobId: taskUUID, status: "processing" }
  },
  async poll(job: Pick<StepJob, "jobId" | "pollUrl">): Promise<StepResult> {
    if (!job.jobId) return { status: "failed", error: "taskUUID yok" }
    const res = await fetch(API, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify([{ taskType: "getResponse", taskUUID: job.jobId }]),
    })
    const json: any = await res.json()
    const data = json?.data?.[0]
    const url = glbUrl(data)
    if (url) return { status: "ready", outputUrl: url } // GLB (URL kalıcı — re-host opsiyonel)
    const status = mapRunwareStatus(data?.status)
    if (status === "processing") return { status: "processing" }
    return { status: "failed", error: json?.errors?.[0]?.message ?? data?.error ?? "GLB URL yok" }
  },
})
