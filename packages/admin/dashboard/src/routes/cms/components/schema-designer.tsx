// CMS şema tasarımcısı — FieldDef[] üzerinde ÖZYİNELEMELİ CRUD. collection.schema editörü.
// Cockpit (helm schema-designer.tsx) portu + nesting: object.fields ve list.of UI'dan
// düzenlenir. dnd-kit yok → ↑/↓; @medusajs/ui; etiketler i18n (cms.kinds / cms.designer).

import { useState } from "react"
import { Button, Input, Label, Select, Switch, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import type { CollectionSchema, FieldDef } from "../lib/schema"

const KINDS: FieldDef["kind"][] = [
  "text",
  "textarea",
  "slug",
  "number",
  "boolean",
  "date",
  "select",
  "asset",
  "image",
  "list",
  "object",
  "ref",
  "richtext",
  "json",
]

// Dil-nötr default değerler (data — kullanıcı hemen düzenler, çeviri gerekmez).
const makeField = (kind: FieldDef["kind"]): FieldDef => {
  const base = { name: "field", label: "Field", required: false }
  switch (kind) {
    case "select":
      return { ...base, kind, options: [{ value: "a", label: "A" }] }
    case "list":
      return {
        ...base,
        kind,
        of: { kind: "text", name: "item", label: "Item" },
      }
    case "object":
      return { ...base, kind, fields: [] }
    case "ref":
      return { ...base, kind, collection: "" }
    default:
      return { ...base, kind } as FieldDef
  }
}

// Tek alanın şekil editörü: kind/name/label/required (+ref) satırı + object/list nesting.
const FieldShape = ({
  field,
  onChange,
}: {
  field: FieldDef
  onChange: (f: FieldDef) => void
}) => {
  const { t } = useTranslation()
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
            {t("cms.designer.type")}
          </Label>
          <Select
            value={field.kind}
            onValueChange={(v) => changeKind(v as FieldDef["kind"])}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {KINDS.map((k) => (
                <Select.Item key={k} value={k}>
                  {t(`cms.kinds.${k}`)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-3">
          <Label size="xsmall" className="text-ui-fg-muted">
            {t("cms.designer.key")}
          </Label>
          <Input
            className="font-mono"
            value={field.name}
            onChange={(e) => onChange({ ...field, name: e.target.value })}
            placeholder={t("cms.designer.keyPh")}
          />
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-4">
          <Label size="xsmall" className="text-ui-fg-muted">
            {t("cms.designer.label")}
          </Label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-2">
          <Label size="xsmall" className="text-ui-fg-muted">
            {t("cms.designer.required")}
          </Label>
          <Switch
            checked={!!field.required}
            onCheckedChange={(c) => onChange({ ...field, required: !!c })}
          />
        </div>

        {field.kind === "ref" ? (
          <div className="flex flex-col gap-y-1 sm:col-span-12">
            <Label size="xsmall" className="text-ui-fg-muted">
              {t("cms.designer.refCollection")}
            </Label>
            <Input
              value={field.collection}
              onChange={(e) =>
                onChange({ ...field, collection: e.target.value })
              }
              placeholder={t("cms.designer.refPh")}
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
            {t("cms.designer.fields")}
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
            {t("cms.designer.itemType")}
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
  const { t } = useTranslation()
  const [addKind, setAddKind] = useState<FieldDef["kind"]>("text")

  const update = (i: number, f: FieldDef) => {
    const a = [...fields]
    a[i] = f
    onChange(a)
  }
  const remove = (i: number) => onChange(fields.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir
    if (target < 0 || target >= fields.length) {
      return
    }
    const a = [...fields]
    ;[a[i], a[target]] = [a[target], a[i]]
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
              aria-label={t("cms.designer.moveUp")}
              className="text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === fields.length - 1}
              aria-label={t("cms.designer.moveDown")}
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
            {t("cms.designer.delete")}
          </Button>
        </div>
      ))}

      {fields.length === 0 ? (
        <div className="border-ui-border-strong rounded-lg border border-dashed p-4 text-center">
          <Text size="small" className="text-ui-fg-muted">
            {t("cms.designer.empty")}
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
            {KINDS.map((k) => (
              <Select.Item key={k} value={k}>
                {t(`cms.kinds.${k}`)}
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
          {t("cms.designer.addField")}
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
