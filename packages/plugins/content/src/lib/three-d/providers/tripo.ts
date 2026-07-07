import type { GenerateInput, GenerateResult, TaskStatus, ThreeDProvider } from "../types"

const BASE = "https://api.tripo3d.ai/v2/openapi"

/** Tripo görev durumu → iç TaskStatus (saf). */
export const mapTripoStatus = (s: string): TaskStatus =>
  s === "success" ? "ready" : s === "queued" || s === "running" ? "processing" : "failed"

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/**
 * Tripo image-to-3D sağlayıcısı. Canlı fetch — key-gated.
 * NOT: `file.url` public bir http URL ister. data: URL girdileri için önce
 * `POST /upload` → `file_token` akışı gerekir (T5 gerçek görselleri bağlarken).
 */
export const createTripoProvider = (apiKey: string): ThreeDProvider => ({
  name: "tripo",
  async create(input: GenerateInput): Promise<GenerateResult> {
    const res = await fetch(`${BASE}/task`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ type: "image_to_model", file: { type: "jpg", url: input.images[0] } }),
    })
    const json: any = await res.json()
    const taskId = json?.data?.task_id
    if (!res.ok || !taskId) {
      return { providerTaskId: "", status: "failed", error: json?.message ?? `HTTP ${res.status}` }
    }
    return { providerTaskId: taskId, status: "processing" }
  },
  async poll(providerTaskId: string): Promise<GenerateResult> {
    const res = await fetch(`${BASE}/task/${providerTaskId}`, { headers: headers(apiKey) })
    const json: any = await res.json()
    const status = mapTripoStatus(json?.data?.status ?? "failed")
    return {
      providerTaskId,
      status,
      meshUrl: status === "ready" ? json?.data?.output?.model : undefined,
      error: status === "failed" ? json?.data?.status ?? json?.message : undefined,
    }
  },
})
