import { model } from "@medusajs/framework/utils"

/**
 * Bir ürünün 3D varlığı — kullanıcı görsel(ler)inden üretilen GLB modeli.
 * Master varlık; turntable ve açı-render'lar bundan (frontend'de) türer.
 * created_at/updated_at/deleted_at otomatik eklenir — elle ekleme.
 */
const Product3DAsset = model.define("product_3d_asset", {
  id: model.id().primaryKey(),
  // Multi-tenant anahtar (ADR-0001). Rollout'ta nullable.
  tenant_id: model.text().nullable(),
  brand_id: model.text().nullable(),
  source: model.text(), // "physical" | "digital-mockup"
  product_ref: model.text().nullable(), // ürün adı/kodu — kütüphane klasörleme anahtarı
  inputs: model.json(), // string[] — girdi görselleri (URL)
  // Pipeline durumu (Flux2→Seedance→SeeDVR state-machine).
  pipeline_step: model.text().nullable(), // "hero"|"orbital"|"upscale"|"sample"|"done"
  step_job_id: model.text().nullable(), // aktif adımın sağlayıcı job id'si
  step_poll_url: model.text().nullable(), // aktif adımın opak poll adresi (BFL polling_url)
  hero_url: model.text().nullable(), // ① Flux2 hero görseli
  video_url: model.text().nullable(), // ②→③ orbital video (4K)
  turntable_urls: model.json().nullable(), // ④ 72 kare (A4b — ffmpeg)
  mesh_url: model.text().nullable(), // ⑤ Faz B GLB
  thumbnail_url: model.text().nullable(),
  provider: model.text(), // "bfl-flux2-pipeline" | "tripo" | ...
  provider_task_id: model.text().nullable(), // eski Tripo yolu (backward-compat)
  status: model.text(), // "processing" | "ready" | "failed"
  error: model.text().nullable(),
})

export default Product3DAsset
