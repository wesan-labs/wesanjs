import { model } from "@medusajs/framework/utils"
import { CmsEntryStatus } from "../types"

// Gerçek içerik. data jsonb (site'ın render ettiği bundle/kayıt). locale + draft/published.
export default model.define(
  { tableName: "cms_entry", name: "CmsEntry" },
  {
    id: model.id({ prefix: "cent" }).primaryKey(),
    // Denormalize tenant scope (RLS her tabloda bağımsız çalışsın diye).
    tenant_id: model.text().nullable(),
    collection_id: model.text(),
    site_id: model.text(),
    slug: model.text(),
    locale: model.text().default("en"),
    status: model.enum(CmsEntryStatus).default(CmsEntryStatus.DRAFT),
    data: model.json().nullable(),
    published_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  }
)
