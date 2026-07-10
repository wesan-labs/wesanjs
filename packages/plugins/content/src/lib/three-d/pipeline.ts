import type { TaskStatus } from "./types"

/**
 * Üretim zinciri (dostunun Flux2→Seedance→SeeDVR hattı). Varlık bu adımları
 * SIRAYLA ilerler; her adım uzun-süren bir uzak-API job'ı. "done" = 72-kare
 * turntable hazır (Faz A çıkışı). GLB (⑤) Faz B, bu state-machine dışında.
 */
export type PipelineStep = "reconstruct" | "hero" | "orbital" | "upscale" | "sample" | "done"

const ORDER: readonly PipelineStep[] = ["reconstruct", "hero", "orbital", "upscale", "sample", "done"]

/** Bir sonraki adım. Saf, O(1). "done" terminal (kendine döner). */
export const nextStep = (s: PipelineStep): PipelineStep =>
  ORDER[Math.min(ORDER.indexOf(s) + 1, ORDER.length - 1)]

/** Uzak-API çağrısı gereken adımlar (④ sample saf/yerel, ⑤ Faz B). */
export type ModelStepId = Exclude<PipelineStep, "sample" | "done">

/**
 * ④ Video → kare örnekleme zaman damgaları (saniye). `count` kareyi
 * [0, duration) aralığına EŞİT böler → kare i açısı = i·(360/count)°.
 * SeeDVR 4K videosundan turntable kareleri bu damgalarda çıkarılır.
 * Saf, deterministik. Time O(count), Space O(count).
 */
export const sampleTimestamps = (durationSec: number, count = 72): number[] => {
  if (durationSec <= 0 || count <= 0) return []
  return Array.from({ length: count }, (_, i) => (i * durationSec) / count)
}

/** Adım job'ı — submit sonucu (poll ile takip). */
export interface StepJob {
  jobId: string
  /** Opak poll adresi (BFL `polling_url` gibi). Varsa poll bunu kullanır — jobId'den kurma (cluster routing bozulur). */
  pollUrl?: string
  status: TaskStatus
  error?: string
}

/** Adım poll sonucu — hazırsa çıktı URL'i (hero: png · orbital/upscale: mp4). */
export interface StepResult {
  status: TaskStatus
  outputUrl?: string
  error?: string
}

/**
 * Tek uzak model adımı. submit+poll, çünkü Flux2/Seedance/SeeDVR üçü de
 * uzun-süren job. Adaptörler (flux/seedance/seedvr) bunu uygular; host
 * (fal · replicate · wavespeed) yalnız bir wiring detayı — swap'lanabilir.
 */
export interface PipelineModelStep {
  readonly name: string
  readonly step: ModelStepId
  submit(input: StepInput): Promise<StepJob>
  poll(job: Pick<StepJob, "jobId" | "pollUrl">): Promise<StepResult>
}

/**
 * Adım girdisi — SADECE kaynak + referanslar (§5b: op-spec ve params burada DEĞİL,
 * descriptor/config'ten gelir; per-run düğme yok).
 */
export interface StepInput {
  /** hero: ürün foto · orbital: hero png · upscale: orbital mp4 */
  sourceUrl: string
  /** ①②: kimlik referans kümesi (BFL ≤8) */
  refs?: string[]
}
