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
  inputs: model.json(), // string[] — girdi görselleri (URL)
  mesh_url: model.text().nullable(), // GLB
  thumbnail_url: model.text().nullable(),
  provider: model.text(), // "tripo" | "meshy" | ...
  provider_task_id: model.text().nullable(),
  status: model.text(), // "processing" | "ready" | "failed"
  error: model.text().nullable(),
})

export default Product3DAsset
