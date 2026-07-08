import { model } from "@medusajs/framework/utils"

/**
 * A saved piece of generated content — an image version (value = data URL) or a
 * text result (value = the text). Persists studio output across sessions so the
 * user keeps a library instead of losing work on refresh.
 */
const ContentItem = model.define("content_item", {
  id: model.id().primaryKey(),
  // Multi-tenant key (ADR-0001). Nullable during rollout; backfilled to the
  // default tenant, then RLS-scoped + app-layer filtered.
  tenant_id: model.text().nullable(),
  kind: model.text(), // "image" | "text" | "video"
  product_ref: model.text().nullable(), // ürün adı/kodu — ürün-bazlı gruplama
  title: model.text().nullable(),
  value: model.text(), // image → data URL; text → the body
  language: model.text().nullable(),
  platform: model.text().nullable(),
  prompt_id: model.text().nullable(),
})

export default ContentItem
