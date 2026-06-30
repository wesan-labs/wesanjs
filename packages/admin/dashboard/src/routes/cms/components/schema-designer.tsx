// CMS şema tasarımcısı — FieldDef[] üzerinde ÖZYİNELEMELİ CRUD. collection.schema editörü.
// Cockpit (helm schema-designer.tsx) portu + nesting: object.fields ve list.of UI'dan
// düzenlenir (cockpit yalnız top-level'dı). dnd-kit yok → ↑/↓; @medusajs/ui.

import { useState } from "react"
import { Button, Input, Label, Select, Switch, Text } from "@medusajs/ui"
import type { CollectionSchema, FieldDef } from "../lib/schema"

const KIND_LABELS: Record<FieldDef["kind"], string> = {
  text: "Metin",
  textarea: "Uzun metin",
  slug: "Slug",
  number: "Sayı",
  boolean: "Anahtar",
  date: "Tarih",
  select: "Seçim",
  asset: "Medya",
  image: "Görsel",
  list: "Liste",
  object: "Grup",
  ref: "Referans",
  richtext: "Zengin metin",
  json: "JSON",
}

const KIND_OPTIONS = Object.entries(KIND_LABELS) as [FieldDef["kind"], string][]

const makeField = (kind: FieldDef["kind"]): FieldDef => {
  const base = { name: "yeni_alan", label: "Yeni Alan", required: false }
  switch (kind) {
    case "select":
      return { ...base, kind, options: [{ value: "a", label: "A" }] }
    case "list":
      return { ...base, kind, of: { kind: "text", name: "item", label: "Öğe" } }
    case "object":
      return { ...base, kind, fields: [] }
    case "ref":
      return { ...base, kind, collection: "" }
    default:
      return { ...base, kind } as FieldDef
  }
}

// Tek alanın şekil editörü: kind/name/label/required (+ref) satırı + object/list nesting.
// move/remove burada YOK (onu FieldsList sarmalar) — list.of gibi tekil şekiller için de kullanılır.
const FieldShape = ({
  field,
  onChange,
}: {
  field: FieldDef
  onChange: (f: FieldDef) => void
}) => {
  // Kind değişimi: name/label/required korunur, variant-özel alanlar default'lanır.
  const changeKind = (next: FieldDef["kind"]) =>
    onChange({
      ...makeField(next),
      name: field.name,
      label: field.label,
      required: field.required,
    })

  return (
    <div className="flex flex-col gap-y-3">
      <div className="grid gap-3 sm:grid-cols-12">
        <div className="flex flex-col gap-y-1 sm:col-span-3">
          <Label size="xsmall" className="text-ui-fg-muted">
            Tip
          </Label>
          <Select
            value={field.kind}
            onValueChange={(v) => changeKind(v as FieldDef["kind"])}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {KIND_OPTIONS.map(([kind, label]) => (
                <Select.Item key={kind} value={kind}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-3">
          <Label size="xsmall" className="text-ui-fg-muted">
            Anahtar (name)
          </Label>
          <Input
            className="font-mono"
            value={field.name}
            onChange={(e) => onChange({ ...field, name: e.target.value })}
            placeholder="ornek_alan"
          />
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-4">
          <Label size="xsmall" className="text-ui-fg-muted">
            Etiket
          </Label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-2">
          <Label size="xsmall" className="text-ui-fg-muted">
            Zorunlu
          </Label>
          <Switch
            checked={!!field.required}
            onCheckedChange={(c) => onChange({ ...field, required: !!c })}
          />
        </div>

        {field.kind === "ref" ? (
          <div className="flex flex-col gap-y-1 sm:col-span-12">
            <Label size="xsmall" className="text-ui-fg-muted">
              Referans collection slug
            </Label>
            <Input
              value={field.collection}
              onChange={(e) =>
                onChange({ ...field, collection: e.target.value })
              }
              placeholder="ör. authors"
            />
          </div>
        ) : null}
      </div>

      {field.kind === "object" ? (
        <div className="border-ui-border-base ml-1 border-l pl-3">
          <Text
            size="xsmall"
            weight="plus"
            className="text-ui-fg-muted mb-2 uppercase tracking-wider"
          >
            Alanlar
          </Text>
          <FieldsList
            fields={field.fields}
            onChange={(fields) => onChange({ ...field, fields })}
          />
        </div>
      ) : null}

      {field.kind === "list" ? (
        <div className="border-ui-border-base ml-1 border-l pl-3">
          <Text
            size="xsmall"
            weight="plus"
            className="text-ui-fg-muted mb-2 uppercase tracking-wider"
          >
            Öğe tipi
          </Text>
          <FieldShape
            field={field.of}
            onChange={(of) => onChange({ ...field, of })}
          />
        </div>
      ) : null}
    </div>
  )
}

// Sıralı alan listesi: her alan FieldShape + ↑/↓/sil; altında "alan ekle".
const FieldsList = ({
  fields,
  onChange,
}: {
  fields: FieldDef[]
  onChange: (f: FieldDef[]) => void
}) => {
  const [addKind, setAddKind] = useState<FieldDef["kind"]>("text")

  const update = (i: number, f: FieldDef) => {
    const a = [...fields]
    a[i] = f
    onChange(a)
  }
  const remove = (i: number) => onChange(fields.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir
    if (t < 0 || t >= fields.length) {
      return
    }
    const a = [...fields]
    ;[a[i], a[t]] = [a[t], a[i]]
    onChange(a)
  }

  return (
    <div className="flex flex-col gap-y-3">
      {fields.map((field, idx) => (
        <div
          key={idx}
          className="border-ui-border-base bg-ui-bg-base flex items-start gap-x-2 rounded-lg border p-3"
        >
          <div className="flex flex-col gap-y-1 pt-5">
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              aria-label="Yukarı"
              className="text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === fields.length - 1}
              aria-label="Aşağı"
              className="text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-30"
            >
              ↓
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <FieldShape field={field} onChange={(f) => update(idx, f)} />
          </div>
          <Button
            type="button"
            variant="transparent"
            size="small"
            onClick={() => remove(idx)}
          >
            Sil
          </Button>
        </div>
      ))}

      {fields.length === 0 ? (
        <div className="border-ui-border-strong rounded-lg border border-dashed p-4 text-center">
          <Text size="small" className="text-ui-fg-muted">
            Alan yok. Aşağıdan ekle.
          </Text>
        </div>
      ) : null}

      <div className="flex items-center gap-x-2">
        <Select
          value={addKind}
          onValueChange={(v) => setAddKind(v as FieldDef["kind"])}
        >
          <Select.Trigger className="w-40">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {KIND_OPTIONS.map(([kind, label]) => (
              <Select.Item key={kind} value={kind}>
                {label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={() => onChange([...fields, makeField(addKind)])}
        >
          + Alan ekle
        </Button>
      </div>
    </div>
  )
}

interface Props {
  value: CollectionSchema
  onChange: (next: CollectionSchema) => void
}

export const SchemaDesigner = ({ value, onChange }: Props) => (
  <FieldsList
    fields={value.fields}
    onChange={(fields) => onChange({ ...value, fields })}
  />
)
