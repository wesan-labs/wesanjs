import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  Textarea,
  clx,
  toast,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { sdk } from "../../../lib/client/client"
import { SectionedForm } from "./sectioned-form"
import { SeoPanel } from "./seo-panel"
import { inferSchema, type CollectionSchema } from "../lib/schema"

type Entry = {
  id: string
  slug: string
  locale: string
  status: string
  data: Record<string, unknown>
}

export const EntryEditor = ({
  entryId,
  collectionId,
  schema,
  previewUrl,
  onClose,
}: {
  entryId: string
  collectionId?: string
  schema?: CollectionSchema | null
  previewUrl?: string | null
  onClose: () => void
}) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: res, isLoading } = useQuery({
    queryKey: ["cms-entry", entryId],
    queryFn: () =>
      sdk.client.fetch<{ entry: Entry }>(`/admin/cms/entries/${entryId}`),
  })
  const entry = res?.entry

  const [data, setData] = useState<Record<string, unknown>>({})
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [mode, setMode] = useState<"form" | "seo" | "json">("form")
  const [text, setText] = useState("")
  const [invalid, setInvalid] = useState(false)
  const [previewOn, setPreviewOn] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (entry) {
      setData(entry.data ?? {})
      setActiveKey((prev) => prev ?? Object.keys(entry.data ?? {})[0] ?? null)
    }
  }, [entry])

  // JSON moduna / section'a geçişte textarea'yı bellekteki güncel değerden doldur.
  useEffect(() => {
    if (activeKey && mode === "json") {
      setText(JSON.stringify(data[activeKey], null, 2))
      setInvalid(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, mode])

  // Form motoru: authored schema (collection.schema) ya da yoksa entry.data'dan
  // türetilmiş jenerik şema. Orijinal data'dan infer → stabil yapı, ucuz.
  const effectiveSchema = useMemo<CollectionSchema>(
    () => schema ?? inferSchema(entry?.data),
    [schema, entry]
  )

  const sectionKeys = useMemo(() => Object.keys(data), [data])

  const onText = (value: string) => {
    setText(value)
    if (!activeKey) {
      return
    }
    try {
      const parsed = JSON.parse(value)
      setData((d) => ({ ...d, [activeKey]: parsed }))
      setInvalid(false)
    } catch {
      setInvalid(true)
    }
  }

  const save = useMutation({
    mutationFn: (payload: {
      data: Record<string, unknown>
      status?: "draft" | "published"
    }) =>
      sdk.client.fetch(`/admin/cms/entries/${entryId}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-entry", entryId] })
      queryClient.invalidateQueries({ queryKey: ["cms-site"] })
      toast.success(t("cms.editor.saved"))
    },
    onError: (error: Error) => {
      toast.error(error?.message || t("cms.editor.saveError"))
    },
  })

  const handleSave = (status?: "draft" | "published") => {
    if (invalid) {
      toast.error(t("cms.editor.invalidJson"))
      return
    }
    save.mutate({ data, ...(status ? { status } : {}) })
  }

  // Türetilen şemayı collection.schema'ya kalıcılaştır → bootstrap'tan authored'a.
  const saveSchema = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/cms/collections/${collectionId}`, {
        method: "POST",
        body: { schema: effectiveSchema },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-site"] })
      toast.success(t("cms.editor.schemaSaved"))
    },
    onError: (error: Error) => {
      toast.error(error?.message || t("cms.schemaModal.saveError"))
    },
  })

  if (isLoading || !entry) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">{t("cms.editor.loading")}</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">
            {t("cms.editor.content", { slug: entry.slug })}
          </Heading>
          <Badge
            size="2xsmall"
            color={entry.status === "published" ? "green" : "orange"}
          >
            {entry.status}
          </Badge>
          <Badge size="2xsmall" color="grey">
            {entry.locale.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="small"
            variant={previewOn ? "primary" : "secondary"}
            disabled={!previewUrl}
            onClick={() => setPreviewOn((v) => !v)}
          >
            {t("cms.editor.preview")}
          </Button>
          <Button size="small" variant="secondary" onClick={onClose}>
            {t("cms.editor.close")}
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => handleSave()}
            isLoading={save.isPending}
          >
            {t("cms.editor.saveDraft")}
          </Button>
          <Button
            size="small"
            onClick={() => handleSave("published")}
            isLoading={save.isPending}
          >
            {t("cms.editor.publish")}
          </Button>
        </div>
      </div>

      {/* Mod toggle: şema-driven form ↔ ham JSON kaçışı */}
      <div className="bg-ui-bg-subtle flex items-center justify-between gap-x-3 px-6 py-2.5">
        <div className="flex items-center gap-x-3">
          <Text size="small" className="text-ui-fg-muted">
            {schema ? t("cms.editor.schema") : t("cms.editor.inferredSchema")} ·{" "}
            {t("cms.editor.fields", { count: effectiveSchema.fields.length })} ·{" "}
            {entry.locale}
          </Text>
          {!schema && collectionId ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => saveSchema.mutate()}
              isLoading={saveSchema.isPending}
            >
              {t("cms.editor.saveSchema")}
            </Button>
          ) : null}
        </div>
        <div className="bg-ui-bg-component inline-flex rounded-lg p-0.5">
          {(["form", "seo", "json"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={clx(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mode === m
                  ? "bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest"
                  : "text-ui-fg-subtle"
              )}
            >
              {m === "form"
                ? t("cms.editor.form")
                : m === "seo"
                ? t("cms.seo.tab")
                : t("cms.editor.rawJson")}
            </button>
          ))}
        </div>
      </div>

      <div
        className={clx(
          previewOn && previewUrl ? "grid grid-cols-1 lg:grid-cols-2" : ""
        )}
      >
        <div
          className={clx(
            "min-w-0",
            previewOn && previewUrl ? "lg:border-r" : ""
          )}
        >
          {mode === "form" ? (
            <div className="max-h-[72vh] overflow-auto p-6">
              <SectionedForm
                schema={effectiveSchema}
                value={data}
                onChange={setData}
              />
            </div>
          ) : mode === "seo" ? (
            <div className="max-h-[72vh] overflow-auto p-6">
              <SeoPanel
                value={
                  data.seo && typeof data.seo === "object"
                    ? (data.seo as Record<string, unknown>)
                    : {}
                }
                onChange={(next) => setData({ ...data, seo: next })}
              />
            </div>
          ) : (
            <div className="grid grid-cols-[220px_1fr]">
              <nav className="flex max-h-[72vh] flex-col gap-y-0.5 overflow-auto border-r p-3">
                {sectionKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setActiveKey(k)}
                    className={clx(
                      "rounded-md px-2 py-1.5 text-left font-mono text-xs",
                      k === activeKey
                        ? "bg-ui-bg-base-pressed text-ui-fg-base font-medium"
                        : "text-ui-fg-subtle hover:bg-ui-bg-base-hover"
                    )}
                  >
                    {k}
                  </button>
                ))}
              </nav>

              <div className="flex max-h-[72vh] flex-col gap-y-2 overflow-auto p-4">
                <div className="flex items-center justify-between">
                  <Text size="small" className="text-ui-fg-subtle font-mono">
                    {activeKey} (JSON)
                  </Text>
                  {invalid ? (
                    <Text size="small" className="text-ui-fg-error">
                      {t("cms.editor.invalidJsonShort")}
                    </Text>
                  ) : null}
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => onText(e.target.value)}
                  rows={26}
                  className={clx(
                    "font-mono text-xs",
                    invalid && "border-ui-border-error"
                  )}
                />
              </div>
            </div>
          )}
        </div>
        {previewOn && previewUrl ? (
          <div className="flex flex-col">
            <div className="bg-ui-bg-subtle flex items-center justify-between gap-x-2 px-4 py-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ui-fg-interactive truncate font-mono text-xs hover:underline"
                title={previewUrl}
              >
                ↗ {t("cms.editor.openTab")}
              </a>
              <Button
                size="small"
                variant="transparent"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                ↻ {t("cms.editor.reload")}
              </Button>
            </div>
            <iframe
              key={reloadKey}
              src={previewUrl}
              title={t("cms.editor.preview")}
              referrerPolicy="no-referrer"
              className="h-[72vh] w-full border-0"
            />
          </div>
        ) : null}
      </div>
    </Container>
  )
}
