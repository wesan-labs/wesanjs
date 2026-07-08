/** 3D üretim durum makinesi. */
export type TaskStatus = "processing" | "ready" | "failed"

/** Sağlayıcıya giden girdi — kullanıcı görselleri (data/http URL) + opsiyonlar. */
export interface GenerateInput {
  images: string[]
  // ileride: texture kalitesi, pbr, vb.
}

/** Sağlayıcı görev sonucu — poll edilir. */
export interface GenerateResult {
  providerTaskId: string
  status: TaskStatus
  meshUrl?: string // hazırsa GLB URL
  error?: string
}

/** Sağlayıcı-agnostik 3D motoru. Tripo/Meshy bunu uygular. */
export interface ThreeDProvider {
  readonly name: string
  create(input: GenerateInput): Promise<GenerateResult>
  poll(providerTaskId: string): Promise<GenerateResult>
}

/** Kalıcı 3D varlık (DB DTO aynası). */
export interface Product3DAssetDTO {
  id: string
  tenant_id: string | null
  brand_id: string | null
  source: "physical" | "digital-mockup"
  product_ref: string | null
  inputs: string[]
  pipeline_step: string | null
  step_job_id: string | null
  step_poll_url: string | null
  hero_url: string | null
  video_url: string | null
  turntable_urls: string[] | null
  mesh_url: string | null
  thumbnail_url: string | null
  provider: string
  provider_task_id: string | null
  status: TaskStatus
  error: string | null
}
