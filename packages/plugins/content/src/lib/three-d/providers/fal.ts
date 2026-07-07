import type { TaskStatus } from "../types"
import type { ModelStepId, PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"

const QUEUE = "https://queue.fal.run"

/** fal.ai queue durumu → iç TaskStatus. Saf. */
export const mapFalStatus = (s: string): TaskStatus =>
  s === "COMPLETED" ? "ready" : s === "IN_QUEUE" || s === "IN_PROGRESS" ? "processing" : "failed"

/** Referans listesini üst sınıra kırp (Flux2/Seedance ≤10 referans). Saf, O(1) slice. */
export const capRefs = <T>(list: T[], max = 10): T[] => list.slice(0, max)

const authHeaders = (apiKey: string) => ({
  Authorization: `Key ${apiKey}`,
  "Content-Type": "application/json",
})

/**
 * Bir fal.ai queue adımının konfigürasyonu. Farklı olan yalnız modelId +
 * girdi/çıktı eşlemesi; submit→status→result akışı ortak (DRY).
 */
export interface FalStepConfig {
  name: string
  step: ModelStepId
  modelId: string
  /** StepInput → fal model gövdesi (modele özel alanlar). */
  toBody: (input: StepInput) => Record<string, unknown>
  /** fal sonuç payload'ı → çıktı URL'i (hero: image · orbital/upscale: video). */
  fromResult: (data: any) => string | undefined
}

/**
 * fal.ai queue tabanlı `PipelineModelStep` fabrikası. Canlı fetch — key-gated.
 * Host (fal) bir wiring detayı; aynı arayüz replicate/wavespeed ile de kurulabilir.
 */
export const createFalStep = (apiKey: string, cfg: FalStepConfig): PipelineModelStep => ({
  name: cfg.name,
  step: cfg.step,
  async submit(input: StepInput): Promise<StepJob> {
    const res = await fetch(`${QUEUE}/${cfg.modelId}`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(cfg.toBody(input)),
    })
    const json: any = await res.json()
    const jobId = json?.request_id
    if (!res.ok || !jobId) {
      return { jobId: "", status: "failed", error: json?.detail ?? `HTTP ${res.status}` }
    }
    return { jobId, status: mapFalStatus(json?.status ?? "IN_QUEUE") }
  },
  async poll(jobId: string): Promise<StepResult> {
    const base = `${QUEUE}/${cfg.modelId}/requests/${jobId}`
    const statusRes = await fetch(`${base}/status`, { headers: authHeaders(apiKey) })
    const statusJson: any = await statusRes.json()
    const status = mapFalStatus(statusJson?.status ?? "failed")
    if (status !== "ready") {
      return { status, error: status === "failed" ? statusJson?.detail ?? statusJson?.status : undefined }
    }
    const res = await fetch(base, { headers: authHeaders(apiKey) })
    const json: any = await res.json()
    const outputUrl = cfg.fromResult(json)
    return outputUrl ? { status: "ready", outputUrl } : { status: "failed", error: "çıktı URL'i yok" }
  },
})
