// CMS şema-as-data sözleşmesi + araçlar.
// Cockpit (helm/apps/web/src/types/cms.ts + lib/cms-schema.ts) portu — Medusa
// dashboard'a uyarlanmış. collection.schema'nın taşıdığı tip budur; şema yoksa
// inferSchema(data) ile JSON'dan jenerik bir şema türetilir (motor hep FieldDef
// tüketir — kaynağı authored ya da inferred fark etmez).

export type CollectionKind = "collection" | "singleton"
export type EntryStatus = "draft" | "published"

export interface FieldBase {
  name: string
  label: string
  required?: boolean
  help?: string
}

export type FieldDef =
  | (FieldBase & { kind: "text"; max?: number })
  | (FieldBase & { kind: "textarea"; rows?: number; max?: number })
  | (FieldBase & { kind: "slug"; source?: string })
  | (FieldBase & { kind: "number"; min?: number; max?: number })
  | (FieldBase & { kind: "boolean" })
  | (FieldBase & { kind: "date" })
  | (FieldBase & {
      kind: "select"
      options: { value: string; label: string }[]
    })
  | (FieldBase & { kind: "image" })
  | (FieldBase & { kind: "asset"; accept?: string })
  | (FieldBase & { kind: "list"; of: FieldDef })
  | (FieldBase & { kind: "object"; fields: FieldDef[] })
  | (FieldBase & { kind: "ref"; collection: string })
  | (FieldBase & { kind: "richtext" })
  | (FieldBase & { kind: "json" })

export interface CollectionSchema {
  fields: FieldDef[]
}

// key → okunabilir etiket: snake/kebab/camel → "Başlık Sözcükleri".
export const humanize = (key: string): string => {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const IMG_RE = /\.(png|jpe?g|svg|webp|gif|avif)$/i
const looksLikeImage = (v: string): boolean =>
  IMG_RE.test(v.trim()) || /^\/?(uploads|images|img|assets)\//i.test(v.trim())

// Tek değerden FieldDef sez (jenerik — elle şekil eşleme yok).
// Time: O(n) (JSON düğüm sayısı), Space: O(d) (derinlik).
export const inferField = (key: string, value: unknown): FieldDef => {
  const base: FieldBase = { name: key, label: humanize(key) }

  if (typeof value === "boolean") {
    return { ...base, kind: "boolean" }
  }
  if (typeof value === "number") {
    return { ...base, kind: "number" }
  }
  if (typeof value === "string") {
    if (key === "slug") {
      return { ...base, kind: "slug" }
    }
    if (looksLikeImage(value)) {
      return { ...base, kind: "image" }
    }
    return value.length > 80 || value.includes("\n")
      ? { ...base, kind: "textarea" }
      : { ...base, kind: "text" }
  }
  if (Array.isArray(value)) {
    const sample = value.find((x) => x != null)
    const of: FieldDef =
      sample !== undefined
        ? inferField("item", sample)
        : { name: "item", label: "Öğe", kind: "text" }
    return { ...base, kind: "list", of }
  }
  if (value && typeof value === "object") {
    const fields = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => inferField(k, v)
    )
    return { ...base, kind: "object", fields }
  }
  // null/undefined → güvenli metin
  return { ...base, kind: "text" }
}

export const inferSchema = (
  data: Record<string, unknown> | null | undefined
): CollectionSchema => ({
  fields: Object.entries(data ?? {}).map(([k, v]) => inferField(k, v)),
})

// Yeni öğe/varsayılan değer üretici (list "ekle" + boş entry için).
export const defaultForField = (field: FieldDef): unknown => {
  switch (field.kind) {
    case "text":
    case "textarea":
    case "slug":
    case "date":
    case "image":
      return ""
    case "number":
      return 0
    case "boolean":
      return false
    case "select":
      return field.options[0]?.value ?? ""
    case "asset":
    case "ref":
      return null
    case "list":
      return []
    case "object": {
      const obj: Record<string, unknown> = {}
      for (const f of field.fields) {
        obj[f.name] = defaultForField(f)
      }
      return obj
    }
    case "richtext":
      return [{ type: "p", children: [{ text: "" }] }]
    case "json":
      return {}
  }
}

export const defaultEntryData = (
  schema: CollectionSchema
): Record<string, unknown> => {
  const data: Record<string, unknown> = {}
  for (const field of schema.fields) {
    data[field.name] = defaultForField(field)
  }
  return data
}
