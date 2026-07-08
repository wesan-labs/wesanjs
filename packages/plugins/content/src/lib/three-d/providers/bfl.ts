import type { TaskStatus } from "../types"
import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"
import type { StepConfig, StepParams } from "../pipeline-def"

// ① FLUX.2 (Black Forest Labs) — BFL DOĞRUDAN API (fal.ai değil). Sözleşme
// doğrulandı: docs.bfl.ml · 2026-07-08 (spec §5). CANLI-DOĞRULANDI: input_image URL.
const BASE = "https://api.bfl.ai"

/** BFL durum → iç TaskStatus. Saf. Pending→processing, Ready→ready, gerisi→failed. */
export const mapBflStatus = (s: string): TaskStatus =>
  s === "Ready" ? "ready" : s === "Pending" ? "processing" : "failed"

/**
 * StepInput + op-spec + params → flux-2 gövdesi. prompt = OP-SPEC (sabit; marka
 * rengi YOK — §5b, marka Faz C'ye). Girdi görselleri `input_image`…`input_image_8`
 * DÜZ alanlar (≤8, dizi değil). URL alır (base64 değil, canlı-doğrulandı). Saf.
 */
export const toFluxBody = (input: StepInput, opSpec: string | null, params: StepParams): Record<string, unknown> => {
  const imgs = [input.sourceUrl, ...(input.refs ?? [])].filter(Boolean).slice(0, 8)
  const body: Record<string, unknown> = {
    prompt: opSpec ?? "clean studio product hero shot",
    output_format: String(params.output_format ?? "png"),
  }
  imgs.forEach((url, i) => {
    body[i === 0 ? "input_image" : `input_image_${i + 1}`] = url
  })
  return body
}

const headers = (apiKey: string) => ({
  "x-key": apiKey,
  accept: "application/json",
  "Content-Type": "application/json",
})

/** ① BFL Flux2 hero adımı. submit→polling_url, poll→result.sample. Canlı fetch — key-gated. */
export const createBflHeroStep = (apiKey: string, cfg: StepConfig): PipelineModelStep => {
  const model = String(cfg.params.model ?? "flux-2-pro")
  return {
    name: model,
    step: "hero",
    async submit(input: StepInput): Promise<StepJob> {
      const res = await fetch(`${BASE}/v1/${model}`, {
        method: "POST",
        headers: headers(apiKey),
        body: JSON.stringify(toFluxBody(input, cfg.opSpec, cfg.params)),
      })
      const json: any = await res.json()
      const jobId = json?.id
      const pollUrl = json?.polling_url
      if (!res.ok || !jobId || !pollUrl) {
        return { jobId: "", status: "failed", error: json?.detail ?? `HTTP ${res.status}` }
      }
      return { jobId, pollUrl, status: "processing" }
    },
    async poll(job: Pick<StepJob, "jobId" | "pollUrl">): Promise<StepResult> {
      // BFL: polling_url ZORUNLU — jobId'den yeniden kurma cluster routing'i bozar.
      if (!job.pollUrl) return { status: "failed", error: "polling_url yok" }
      const res = await fetch(job.pollUrl, { headers: headers(apiKey) })
      const json: any = await res.json()
      const status = mapBflStatus(json?.status ?? "Error")
      if (status !== "ready") {
        return { status, error: status === "failed" ? json?.status ?? "BFL error" : undefined }
      }
      // ⚠️ result.sample URL'i 10 dk'da EXPIRE — re-host adımında indir + sakla.
      const outputUrl = json?.result?.sample
      return outputUrl ? { status: "ready", outputUrl } : { status: "failed", error: "result.sample yok" }
    },
  }
}
