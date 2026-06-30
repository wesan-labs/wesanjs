import { model } from "@medusajs/framework/utils"
import { CmsCollectionKind } from "../types"

// Site içindeki koleksiyon (singleton "site-bundle" ya da çok-kayıtlı "blog").
// schema = şema-as-data ({ fields: FieldDef[] }) — editör formunu üretir.
export default model.define(
  { tableName: "cms_collection", name: "CmsCollection" },
  {
    id: model.id({ prefix: "ccol" }).primaryKey(),
    site_id: model.text(),
    slug: model.text(),
    label: model.text(),
    kind: model.enum(CmsCollectionKind).default(CmsCollectionKind.SINGLETON),
    schema: model.json().nullable(),
    metadata: model.json().nullable(),
  }
)
