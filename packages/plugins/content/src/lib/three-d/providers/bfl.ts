import type { TaskStatus } from "../types"
import type { PipelineModelStep, StepInput, StepJob, StepResult } from "../pipeline"

// ① FLUX.2 (Black Forest Labs) — BFL DOĞRUDAN API (fal.ai değil). Sözleşme
// doğrulandı: docs.bfl.ml · 2026-07-08 (spec §5).
const BASE = "https://api.bfl.ai"
const HERO_MODEL = "flux-2-pro" // default; alt: flux-2-flex (tipografi/detay)

/** BFL durum → iç TaskStatus. Saf. Pending→processing, Ready→ready, gerisi→failed. */
export const mapBflStatus = (s: string): TaskStatus =>
  s === "Ready" ? "ready" : s === "Pending" ? "processing" : "failed"

/**
 * Marka rengini prompt'a göm — BFL'de hex marka rengi API alanı YOK (doğrulandı).
 * Renk ancak metinle geçer. Saf.
 */
export const buildHeroPrompt = (input: StepInput): string => {
  const base = input.prompt ?? "clean studio product hero shot, soft light, seamless background"
  return input.brandHex ? `${base}, brand accent color ${input.brandHex}` : base
}

/**
 * StepInput → flux-2 gövdesi. Girdi görselleri `input_image`…`input_image_8`
 * DÜZ alanlar (dizi değil), 8 referans sınırı (doğrulandı). Saf.
 * CANLI-DOĞRULANDI (2026-07-08): alanlar URL alır (base64 DEĞİL); BFL görseli
 * sunucu-taraf çeker → URL DOĞRUDAN erişilebilir olmalı (redirect/403 yasak),
 * yoksa "Unable to extract dimensions". A4'te kullanıcı yüklemesi S3/R2'ye re-host.
 */
export const toFluxBody = (input: StepInput): Record<string, unknown> => {
  const imgs = [input.sourceUrl, ...(input.refs ?? [])].filter(Boolean).slice(0, 8)
  const body: Record<string, unknown> = {
    prompt: buildHeroPrompt(input),
    output_format: "png",
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
export const createBflHeroStep = (apiKey: string): PipelineModelStep => ({
  name: "flux2-pro",
  step: "hero",
  async submit(input: StepInput): Promise<StepJob> {
    const res = await fetch(`${BASE}/v1/${HERO_MODEL}`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(toFluxBody(input)),
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
    // ⚠️ result.sample URL'i 10 dk'da EXPIRE — A4'te indir + re-host.
    const outputUrl = json?.result?.sample
    return outputUrl ? { status: "ready", outputUrl } : { status: "failed", error: "result.sample yok" }
  },
})
