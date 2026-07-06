// CMS dinamik form renderer — schema.fields[] → @medusajs/ui kontrol haritası.
// Cockpit (helm form-renderer.tsx) portu. list/object özyinelemeli; etiketler i18n.
// richtext/asset/ref şimdilik güvenli fallback (Faz 3: Plate + asset + ref picker).

import {
  Button,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  clx,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { defaultForField, slugify, type FieldDef } from "../lib/schema"

const SCALAR_FIELD_KINDS = new Set([
  "text",
  "textarea",
  "slug",
  "number",
  "date",
  "select",
  "boolean",
  "image",
  "asset",
  "ref",
])

const isRowObjectList = (
  of: FieldDef
): of is FieldDef & { kind: "object"; fields: FieldDef[] } =>
  of.kind === "object" &&
  of.fields.length >= 1 &&
  of.fields.length <= 8 &&
  of.fields.every((f) => SCALAR_FIELD_KINDS.has(f.kind))

interface FieldInputProps {
  id: string
  field: FieldDef
  value: unknown
  onChange: (next: unknown) => void
  siblings: Record<string, unknown>
  /** Tablo satırında etiket yerine placeholder */
  inline?: boolean
}

const FieldInput = ({
  id,
  field,
  value,
  onChange,
  siblings,
  inline = false,
}: FieldInputProps) => {
  const { t } = useTranslation()
  const inlinePlaceholder = inline ? field.label : undefined
  switch (field.kind) {
    case "text":
      return (
        <Input
          id={id}
          size="small"
          placeholder={inlinePlaceholder}
          value={(value as string) ?? ""}
          maxLength={field.max}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "textarea":
      return (
        <Textarea
          id={id}
          value={(value as string) ?? ""}
          rows={field.rows ?? 4}
          maxLength={field.max}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "slug": {
      const sourceVal =
        field.source && typeof siblings[field.source] === "string"
          ? (siblings[field.source] as string)
          : ""
      return (
        <div className="flex items-center gap-x-2">
          <Input
            id={id}
            className="font-mono"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("cms.form.slugPh")}
          />
          {field.source ? (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => onChange(slugify(sourceVal))}
              disabled={!sourceVal}
            >
              {t("cms.form.auto")}
            </Button>
          ) : null}
        </div>
      )
    }

    case "number":
      return (
        <Input
          id={id}
          type="number"
          value={(value as number) ?? 0}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )

    case "boolean":
      return (
        <Switch
          id={id}
          checked={!!value}
          onCheckedChange={(c) => onChange(!!c)}
        />
      )

    case "date":
      return (
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case "image": {
      const url = (value as string) ?? ""
      return (
        <div className="flex flex-col gap-y-2">
          <Input
            id={id}
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("cms.form.imagePh")}
          />
          {url.trim() ? (
            <img
              src={url}
              alt=""
              loading="lazy"
              className="bg-ui-bg-subtle h-20 w-auto max-w-[180px] rounded-md border object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
              onLoad={(e) => {
                e.currentTarget.style.display = ""
              }}
            />
          ) : null}
        </div>
      )
    }

    case "select":
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
        >
          <Select.Trigger id={id}>
            <Select.Value placeholder={t("cms.form.selectPh")} />
          </Select.Trigger>
          <Select.Content>
            {field.options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      )

    // Faz 3 fallback: asset/ref → düz metin (UUID/yol). Picker sonraki dilim.
    case "asset":
    case "ref":
      return (
        <Input
          id={id}
          className="font-mono"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            field.kind === "ref"
              ? t("cms.form.refIdPh", { collection: field.collection })
              : t("cms.form.assetIdPh")
          }
        />
      )

    case "list": {
      const items = Array.isArray(value) ? value : []
      const objectItems = field.of.kind === "object"
      const rowLayout = objectItems && isRowObjectList(field.of)
      const objectFields = rowLayout ? field.of.fields : []

      if (rowLayout) {
        const colTemplate = `repeat(${objectFields.length}, minmax(0, 1fr)) 2.25rem`
        return (
          <div className="border-ui-border-base overflow-hidden rounded-md border">
            <div
              className="bg-ui-bg-subtle border-ui-border-base grid items-center gap-x-2 gap-y-0 border-b px-2 py-1.5"
              style={{ gridTemplateColumns: colTemplate }}
            >
              {objectFields.map((f) => (
                <Text
                  key={f.name}
                  size="xsmall"
                  weight="plus"
                  className="text-ui-fg-muted truncate uppercase tracking-wide"
                >
                  {f.label}
                </Text>
              ))}
              <span />
            </div>
            {items.length === 0 ? (
              <Text size="xsmall" className="text-ui-fg-muted px-2 py-2">
                {t("cms.form.emptyList", { defaultValue: "No items yet." })}
              </Text>
            ) : (
              items.map((item, idx) => {
                const row =
                  item && typeof item === "object" && !Array.isArray(item)
                    ? (item as Record<string, unknown>)
                    : {}
                return (
                  <div
                    key={idx}
                    className="border-ui-border-base hover:bg-ui-bg-subtle grid items-center gap-x-2 gap-y-0 border-b px-2 py-1 last:border-b-0"
                    style={{ gridTemplateColumns: colTemplate }}
                  >
                    {objectFields.map((f) => (
                      <FieldInput
                        key={f.name}
                        id={`${id}-${idx}-${f.name}`}
                        field={f}
                        value={row[f.name]}
                        inline
                        onChange={(next) => {
                          const arr = [...items]
                          arr[idx] = { ...row, [f.name]: next }
                          onChange(arr)
                        }}
                        siblings={row}
                      />
                    ))}
                    <Button
                      type="button"
                      variant="transparent"
                      size="small"
                      className="text-ui-fg-muted shrink-0"
                      onClick={() =>
                        onChange(items.filter((_, i) => i !== idx))
                      }
                      aria-label={t("cms.form.delete")}
                    >
                      ×
                    </Button>
                  </div>
                )
              })
            )}
            <div className="bg-ui-bg-subtle border-ui-border-base border-t px-2 py-1.5">
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() =>
                  onChange([...items, defaultForField(field.of)])
                }
              >
                {t("cms.form.addItem")}
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="flex flex-col gap-y-1.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="border-ui-border-base flex flex-wrap items-end gap-2 rounded-md border px-2 py-1.5"
            >
              {objectItems ? (
                field.of.fields.map((f) => (
                  <div key={f.name} className="min-w-[120px] flex-1">
                    <FieldInput
                      id={`${id}-${idx}-${f.name}`}
                      field={f}
                      value={
                        item &&
                        typeof item === "object" &&
                        !Array.isArray(item)
                          ? (item as Record<string, unknown>)[f.name]
                          : undefined
                      }
                      inline
                      onChange={(next) => {
                        const obj =
                          item &&
                          typeof item === "object" &&
                          !Array.isArray(item)
                            ? { ...(item as Record<string, unknown>) }
                            : {}
                        obj[f.name] = next
                        const arr = [...items]
                        arr[idx] = obj
                        onChange(arr)
                      }}
                      siblings={
                        item &&
                        typeof item === "object" &&
                        !Array.isArray(item)
                          ? (item as Record<string, unknown>)
                          : {}
                      }
                    />
                  </div>
                ))
              ) : (
                <FieldInput
                  id={`${id}-${idx}`}
                  field={field.of}
                  value={item}
                  onChange={(next) => {
                    const arr = [...items]
                    arr[idx] = next
                    onChange(arr)
                  }}
                  siblings={siblings}
                />
              )}
              <Button
                type="button"
                variant="transparent"
                size="small"
                className="text-ui-fg-muted shrink-0"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                aria-label={t("cms.form.delete")}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="small"
            className="self-start"
            onClick={() => onChange([...items, defaultForField(field.of)])}
          >
            {t("cms.form.addItem")}
          </Button>
        </div>
      )
    }

    case "object": {
      const obj =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {}
      const compact = field.fields.every((f) =>
        ["text", "slug", "number", "boolean", "date", "select", "image"].includes(
          f.kind
        )
      )
      return (
        <div
          className={clx(
            "border-ui-border-base rounded-lg border p-3",
            compact
              ? "grid grid-cols-2 gap-3"
              : "flex flex-col gap-y-3"
          )}
        >
          {field.fields.map((f) => (
            <FieldRow
              key={f.name}
              field={f}
              value={obj[f.name]}
              onChange={(next) => onChange({ ...obj, [f.name]: next })}
              siblings={obj}
              compact={compact}
            />
          ))}
          {field.fields.length === 0 ? (
            <p className="text-ui-fg-muted text-xs italic">
              {t("cms.form.emptyGroup")}
            </p>
          ) : null}
        </div>
      )
    }

    // Faz 3 fallback: richtext → Plate yerine JSON textarea (Plate değerini bozmaz).
    case "richtext":
    case "json":
      return (
        <Textarea
          id={id}
          value={JSON.stringify(
            value ?? (field.kind === "richtext" ? [] : {}),
            null,
            2
          )}
          rows={field.kind === "richtext" ? 8 : 6}
          className="font-mono text-xs"
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value)
            }
          }}
        />
      )
  }
}

interface FieldRowProps {
  field: FieldDef
  value: unknown
  onChange: (next: unknown) => void
  siblings: Record<string, unknown>
  compact?: boolean
  /** Liste/tablo alanları için daha sıkı dikey boşluk */
  dense?: boolean
}

const FieldRow = ({
  field,
  value,
  onChange,
  siblings,
  compact = false,
  dense = false,
}: FieldRowProps) => {
  const id = `cms-field-${field.name}`
  const isList = field.kind === "list"
  return (
    <div
      className={clx(
        "flex flex-col",
        dense || isList ? "gap-y-1" : compact ? "gap-y-1.5" : "gap-y-2"
      )}
    >
      <Label htmlFor={id} size="small" weight="plus">
        {field.label}
        {field.required ? <span className="text-ui-fg-error"> *</span> : null}
      </Label>
      <FieldInput
        id={id}
        field={field}
        value={value}
        onChange={onChange}
        siblings={siblings}
      />
      {field.help ? (
        <p className="text-ui-fg-muted text-xs">{field.help}</p>
      ) : null}
    </div>
  )
}

interface FormRendererProps {
  fields: FieldDef[]
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

export const FormRenderer = ({
  fields,
  value,
  onChange,
}: FormRendererProps) => {
  const { t } = useTranslation()
  const setField = (name: string, next: unknown) =>
    onChange({ ...value, [name]: next })

  if (fields.length === 0) {
    return <p className="text-ui-fg-muted text-sm">{t("cms.form.noFields")}</p>
  }

  return (
    <div className="flex flex-col gap-y-3">
      {fields.map((field) => (
        <FieldRow
          key={field.name}
          field={field}
          value={value[field.name]}
          onChange={(next) => setField(field.name, next)}
          siblings={value}
          dense={field.kind === "list"}
        />
      ))}
    </div>
  )
}
