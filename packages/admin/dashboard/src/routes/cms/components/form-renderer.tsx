// CMS dinamik form renderer — schema.fields[] → @medusajs/ui kontrol haritası.
// Cockpit (helm form-renderer.tsx) portu. list/object özyinelemeli; etiketler i18n.
// richtext/asset/ref şimdilik güvenli fallback (Faz 3: Plate + asset + ref picker).

import {
  Button,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
  clx,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { defaultForField, slugify, type FieldDef } from "../lib/schema"

interface FieldInputProps {
  id: string
  field: FieldDef
  value: unknown
  onChange: (next: unknown) => void
  siblings: Record<string, unknown>
}

const FieldInput = ({
  id,
  field,
  value,
  onChange,
  siblings,
}: FieldInputProps) => {
  const { t } = useTranslation()
  switch (field.kind) {
    case "text":
      return (
        <Input
          id={id}
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
      return (
        <div className="border-ui-border-base flex flex-col gap-y-3 rounded-lg border p-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-x-2">
              <div className="flex-1">
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
              </div>
              <Button
                type="button"
                variant="transparent"
                size="small"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
              >
                {t("cms.form.delete")}
              </Button>
            </div>
          ))}
          <div>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => onChange([...items, defaultForField(field.of)])}
            >
              {t("cms.form.addItem")}
            </Button>
          </div>
        </div>
      )
    }

    case "object": {
      const obj =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {}
      return (
        <div className="border-ui-border-base flex flex-col gap-y-4 rounded-lg border p-3">
          {field.fields.map((f) => (
            <FieldRow
              key={f.name}
              field={f}
              value={obj[f.name]}
              onChange={(next) => onChange({ ...obj, [f.name]: next })}
              siblings={obj}
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
}

const FieldRow = ({ field, value, onChange, siblings }: FieldRowProps) => {
  const id = `cms-field-${field.name}`
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-x-2">
        <Label htmlFor={id} size="small" weight="plus">
          {field.label}
          {field.required ? <span className="text-ui-fg-error"> *</span> : null}
        </Label>
        <span className="text-ui-fg-muted bg-ui-bg-component rounded px-1.5 py-0.5 font-mono text-[10px]">
          {field.kind}
        </span>
      </div>
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
    <div className={clx("flex flex-col gap-y-4")}>
      {fields.map((field) => (
        <FieldRow
          key={field.name}
          field={field}
          value={value[field.name]}
          onChange={(next) => setField(field.name, next)}
          siblings={value}
        />
      ))}
    </div>
  )
}
