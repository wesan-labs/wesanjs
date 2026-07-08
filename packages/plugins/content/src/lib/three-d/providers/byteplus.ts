import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"
import type { StepConfig, StepParams } from "../pipeline-def"
import type { TaskStatus } from "../types"

// ② Seedance 2.0 (ByteDance) — BytePlus Ark üzerinden (fal DEĞİL). Sözleşme
// doğrulandı: ark.ap-southeast.bytepluses.com · 2026-07-08 (spec §5).
const TASKS_URL = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks"

/** Ark görev durumu → iç TaskStatus. Saf. */
export const mapArkStatus = (s: string): TaskStatus =>
  s === "succeeded" ? "ready" : s === "queued" || s === "running" ? "processing" : "failed"

/**
 * StepInput + op-spec + params → Seedance `content` gövdesi. text = OP-SPEC (sabit
 * kamera hareketi). hero = `first_frame`, refs = `reference_image` (kimlik kilidi —
 * YAPISAL, prompt değil). model/ratio/resolution/duration = params. Saf.
 */
export const toSeedanceBody = (input: StepInput, opSpec: string | null, params: StepParams): Record<string, unknown> => {
  const content: Record<string, unknown>[] = [
    { type: "text", text: opSpec ?? "product rotates a full 360 degrees, camera static" },
    { type: "image_url", image_url: { url: input.sourceUrl }, role: "first_frame" },
    ...(input.refs ?? []).map((url) => ({ type: "image_url", image_url: { url }, role: "reference_image" })),
  ]
  return {
    model: String(params.model ?? "dreamina-seedance-2-0-260128"),
    content,
    ratio: String(params.ratio ?? "1:1"),
    resolution: String(params.resolution ?? "720p"),
    duration: Number(params.duration ?? 5),
  }
}

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/** ② BytePlus Seedance orbital adımı. submit→task id, poll→content.video_url. key-gated. */
export const createSeedanceOrbitalStep = (apiKey: string, cfg: StepConfig): PipelineModelStep => ({
  name: "seedance2",
  step: "orbital",
  async submit(input: StepInput): Promise<StepJob> {
    const res = await fetch(TASKS_URL, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(toSeedanceBody(input, cfg.opSpec, cfg.params)),
    })
    const json: any = await res.json()
    const id = json?.id ?? json?.data?.id
    if (!res.ok || !id) {
      return { jobId: "", status: "failed", error: json?.error?.message ?? json?.message ?? `HTTP ${res.status}` }
    }
    return { jobId: id, pollUrl: `${TASKS_URL}/${id}`, status: "processing" }
  },
  async poll(job: Pick<StepJob, "jobId" | "pollUrl">): Promise<StepResult> {
    const url = job.pollUrl ?? `${TASKS_URL}/${job.jobId}`
    const res = await fetch(url, { headers: headers(apiKey) })
    const json: any = await res.json()
    const status = mapArkStatus(json?.status ?? "failed")
    if (status !== "ready") {
      return { status, error: status === "failed" ? json?.error?.message ?? json?.status : undefined }
    }
    // ⚠️ content.video_url geçici (24s) → re-host adımında indir + sakla.
    const outputUrl = json?.content?.video_url
    return outputUrl ? { status: "ready", outputUrl } : { status: "failed", error: "content.video_url yok" }
  },
})
