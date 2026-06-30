import { model } from "@medusajs/framework/utils"

// Yönetilen site/marka (wesan, friday, ...). Önizleme + publish bağlantı config'i de burada.
export default model.define(
  { tableName: "cms_site", name: "CmsSite" },
  {
    id: model.id({ prefix: "csite" }).primaryKey(),
    slug: model.text().unique(),
    name: model.text(),
    base_url: model.text().nullable(),
    preview_secret: model.text().nullable(),
    locales: model.json().nullable(),
    enabled: model.boolean().default(true),
    metadata: model.json().nullable(),
  }
)
