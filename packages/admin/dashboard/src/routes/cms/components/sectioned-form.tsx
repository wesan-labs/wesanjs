// CMS iki-pane tipli panel + sağ panede drill-down. Cockpit (helm sectioned-form.tsx) portu.
// Sol ray: top-level bölümler. Sağ pane: seçili bölüm; object çocukları breadcrumb ile
// derinleşir (Pages › Home › Hero), leaf+list alanları o seviyede inline düzenlenir.
// "pages" gibi derin ağaç tek wall yerine gezinilebilir detay olur.

import { Fragment, useState } from "react"
import { Text, clx } from "@medusajs/ui"
import { FormRenderer } from "./form-renderer"
import type { CollectionSchema, FieldDef } from "../lib/schema"

const GENERAL = "__general"

type Section =
  | { key: typeof GENERAL; label: string; fields: FieldDef[]; pick: "root" }
  | {
      key: string
      label: string
      fields: FieldDef[]
      pick: "child"
      childKey: string
    }
  | { key: string; label: string; fields: FieldDef[]; pick: "root" }

// Top-level bölümler: object → kendi alanları; list → tek alan; kalan leaf'ler "Genel"de.
const buildSections = (schema: CollectionSchema): Section[] => {
  const sections: Section[] = []
  const leaves = schema.fields.filter(
    (f) => f.kind !== "object" && f.kind !== "list"
  )
  if (leaves.length) {
    sections.push({
      key: GENERAL,
      label: "Genel",
      fields: leaves,
      pick: "root",
    })
  }
  for (const f of schema.fields) {
    if (f.kind === "object") {
      sections.push({
        key: f.name,
        label: f.label,
        fields: f.fields,
        pick: "child",
        childKey: f.name,
      })
    } else if (f.kind === "list") {
      sections.push({ key: f.name, label: f.label, fields: [f], pick: "root" })
    }
  }
  return sections
}

const isObjectVal = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v)

// path boyunca immutable yaz (ara düğüm yoksa {} ile oluştur).
const setAtPath = (data: unknown, path: string[], slice: unknown): unknown => {
  if (path.length === 0) {
    return slice
  }
  const [head, ...rest] = path
  const node = isObjectVal(data) ? data : {}
  return { ...node, [head]: setAtPath(node[head], rest, slice) }
}

interface Props {
  schema: CollectionSchema
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

export const SectionedForm = ({ schema, value, onChange }: Props) => {
  const sections = buildSections(schema)
  const [active, setActive] = useState<string | null>(null)
  const activeKey = active ?? sections[0]?.key ?? null
  const current = sections.find((s) => s.key === activeKey)

  if (sections.length === 0) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        Şema boş — bu entry'de alan yok.
      </Text>
    )
  }

  // Bölümün kök data slice'ı + o slice'a geri yazan onChange.
  let sectionValue: Record<string, unknown> = value
  let sectionOnChange: (next: Record<string, unknown>) => void = onChange
  if (current && current.pick === "child") {
    const ck = current.childKey
    const raw = value[ck]
    sectionValue = isObjectVal(raw) ? raw : {}
    sectionOnChange = (next) => onChange({ ...value, [ck]: next })
  }

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <nav className="border-ui-border-base flex flex-col gap-y-0.5 md:border-r md:pr-3">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={clx(
              "flex items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              s.key === activeKey
                ? "bg-ui-bg-base-pressed text-ui-fg-base font-medium"
                : "text-ui-fg-subtle hover:bg-ui-bg-base-hover"
            )}
          >
            <span
              className={clx(
                "size-1.5 shrink-0 rounded-full",
                s.key === activeKey
                  ? "bg-ui-fg-interactive"
                  : "bg-ui-border-base"
              )}
            />
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="min-w-0">
        {current ? (
          <SectionDetail
            key={current.key}
            rootLabel={current.label}
            fields={current.fields}
            value={sectionValue}
            onChange={sectionOnChange}
          />
        ) : null}
      </div>
    </div>
  )
}

interface DetailProps {
  rootLabel: string
  fields: FieldDef[]
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

// Bölüm içi drill-down: object çocukları breadcrumb ile derinleşir, leaf/list inline kalır.
const SectionDetail = ({ rootLabel, fields, value, onChange }: DetailProps) => {
  const [subPath, setSubPath] = useState<string[]>([])

  let curFields = fields
  let curValue: Record<string, unknown> = value
  const crumbs: { label: string; depth: number }[] = [
    { label: rootLabel, depth: 0 },
  ]
  for (let i = 0; i < subPath.length; i++) {
    const f = curFields.find((x) => x.name === subPath[i])
    if (!f || f.kind !== "object") {
      break
    }
    crumbs.push({ label: f.label, depth: i + 1 })
    curFields = f.fields
    const child = curValue[subPath[i]]
    curValue = isObjectVal(child) ? child : {}
  }

  const navChildren = curFields.filter((f) => f.kind === "object")
  const inlineChildren = curFields.filter((f) => f.kind !== "object")

  const handleInline = (nextSlice: Record<string, unknown>) =>
    onChange(setAtPath(value, subPath, nextSlice) as Record<string, unknown>)

  return (
    <div className="flex flex-col gap-y-4">
      <nav className="flex flex-wrap items-center gap-x-1 text-sm">
        {crumbs.map((c, i) => (
          <Fragment key={c.depth}>
            {i > 0 ? <span className="text-ui-fg-muted">›</span> : null}
            <button
              type="button"
              onClick={() => setSubPath(subPath.slice(0, c.depth))}
              className={clx(
                i === crumbs.length - 1
                  ? "text-ui-fg-base font-semibold"
                  : "text-ui-fg-subtle hover:text-ui-fg-base"
              )}
            >
              {c.label}
            </button>
          </Fragment>
        ))}
      </nav>

      {navChildren.length > 0 ? (
        <div className="flex flex-col gap-y-1">
          {navChildren.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => setSubPath([...subPath, f.name])}
              className="border-ui-border-base hover:bg-ui-bg-base-hover group flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors"
            >
              <span className="truncate font-medium">{f.label}</span>
              <span className="text-ui-fg-muted flex shrink-0 items-center gap-x-1.5 text-xs">
                {f.kind === "object" ? `${f.fields.length} alan` : ""}
                <span>›</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {inlineChildren.length > 0 ? (
        <FormRenderer
          fields={inlineChildren}
          value={curValue}
          onChange={handleInline}
        />
      ) : null}

      {navChildren.length === 0 && inlineChildren.length === 0 ? (
        <Text size="small" className="text-ui-fg-muted">
          Bu bölümde alan yok.
        </Text>
      ) : null}
    </div>
  )
}
