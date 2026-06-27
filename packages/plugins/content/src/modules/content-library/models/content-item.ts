import { model } from "@medusajs/framework/utils"

/**
 * A saved piece of generated content — an image version (value = data URL) or a
 * text result (value = the text). Persists studio output across sessions so the
 * user keeps a library instead of losing work on refresh.
 */
const ContentItem = model.define("content_item", {
  id: model.id().primaryKey(),
  kind: model.text(), // "image" | "text"
  title: model.text().nullable(),
  value: model.text(), // image → data URL; text → the body
  language: model.text().nullable(),
  platform: model.text().nullable(),
  prompt_id: model.text().nullable(),
})

export default ContentItem
