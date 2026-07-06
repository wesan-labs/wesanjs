import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  FocusModal,
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
  inline = false,
  showSchemaBar = true,
  mode: controlledMode,
  onModeChange,
  activeSectionKey,
  onActiveSectionChange,
  externalSectionNav = false,
}: {
  entryId: string
  collectionId?: string
  schema?: CollectionSchema | null
  previewUrl?: string | null
  onClose?: () => void
  inline?: boolean
  showSchemaBar?: boolean
  mode?: "form" | "seo" | "json"
  onModeChange?: (mode: "form" | "seo" | "json") => void
  activeSectionKey?: string | null
  onActiveSectionChange?: (key: string) => void
  /** Sol panelde bölüm nav'ı varsa editörde gizle */
  externalSectionNav?: boolean
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
  const [internalMode, setInternalMode] = useState<"form" | "seo" | "json">("form")
  const mode = controlledMode ?? internalMode
  const setMode = (next: "form" | "seo" | "json") => {
    if (onModeChange) {
      onModeChange(next)
    } else {
      setInternalMode(next)
    }
  }
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

  useEffect(() => {
    if (activeKey && mode === "json") {
      setText(JSON.stringify(data[activeKey], null, 2))
      setInvalid(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, mode])

  const hasAuthoredSchema = !!schema?.fields?.length

  const effectiveSchema = useMemo<CollectionSchema>(() => {
    const inferred = inferSchema(entry?.data)
    if (!hasAuthoredSchema) {
      return inferred
    }
    return schema!
  }, [schema, entry, hasAuthoredSchema])

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

  const toolbar = (
    <div
      className={clx(
        "flex flex-wrap items-center justify-between gap-3",
        inline ? "px-5 py-3" : "w-full"
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2">
        {isLoading || !entry ? (
          <Text size="small" className="text-ui-fg-subtle">
            {t("cms.editor.loading")}
          </Text>
        ) : (
          <>
            <Heading level="h2" className="truncate text-base">
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
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2">
        <Button
          size="small"
          variant={previewOn ? "primary" : "secondary"}
          disabled={!previewUrl}
          onClick={() => setPreviewOn((v) => !v)}
        >
          {t("cms.editor.preview")}
        </Button>
        {!inline && onClose ? (
          <FocusModal.Close asChild>
            <Button size="small" variant="secondary" onClick={onClose}>
              {t("cms.editor.close")}
            </Button>
          </FocusModal.Close>
        ) : null}
        <Button
          size="small"
          variant="secondary"
          onClick={() => handleSave()}
          isLoading={save.isPending}
          disabled={isLoading || !entry}
        >
          {t("cms.editor.saveDraft")}
        </Button>
        <Button
          size="small"
          onClick={() => handleSave("published")}
          isLoading={save.isPending}
          disabled={isLoading || !entry}
        >
          {t("cms.editor.publish")}
        </Button>
      </div>
    </div>
  )

  const modeBar = (
    <div
      className={clx(
        "border-ui-border-base bg-ui-bg-subtle flex flex-wrap items-center justify-between gap-x-3 border-b",
        inline ? "px-5 py-2" : "px-5 py-2"
      )}
    >
      {showSchemaBar ? (
        <div className="flex flex-wrap items-center gap-x-3">
          <Text size="small" className="text-ui-fg-muted">
            {hasAuthoredSchema
              ? t("cms.editor.schema")
              : t("cms.editor.inferredSchema")}{" "}
            · {t("cms.editor.fields", { count: effectiveSchema.fields.length })}
          </Text>
          {!hasAuthoredSchema && collectionId ? (
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
      ) : (
        <Text size="small" className="text-ui-fg-muted">
          {t("cms.editor.contentSection")}
        </Text>
      )}
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
                : "text-ui-fg-subtle hover:text-ui-fg-base"
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
  )

  const body = (
    <>
      {modeBar}
      <div
        className={clx(
          "min-h-0",
          previewOn && previewUrl
            ? "grid grid-cols-1 lg:grid-cols-2"
            : "flex flex-col",
          inline ? "min-h-[360px]" : "flex-1"
        )}
      >
        <div
          className={clx(
            "min-h-0 min-w-0 overflow-auto",
            previewOn && previewUrl ? "lg:border-r" : ""
          )}
        >
          {isLoading || !entry ? (
            <div className="flex items-center justify-center p-8">
              <Text className="text-ui-fg-subtle">{t("cms.editor.loading")}</Text>
            </div>
          ) : mode === "form" ? (
            <div className="p-5">
              <SectionedForm
                schema={effectiveSchema}
                value={data}
                onChange={setData}
                activeKey={activeSectionKey}
                onActiveKeyChange={onActiveSectionChange}
                hideNav={externalSectionNav}
              />
            </div>
          ) : mode === "seo" ? (
            <div className="p-5">
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
            <div className="grid min-h-[40vh] grid-cols-[minmax(140px,180px)_1fr]">
              <nav className="border-ui-border-base flex flex-col gap-y-0.5 overflow-auto border-r p-2">
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
              <div className="flex flex-col gap-y-2 overflow-auto p-4">
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
                  rows={24}
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
          <div className="flex min-h-0 flex-col">
            <div className="bg-ui-bg-subtle flex items-center justify-between gap-x-2 border-b px-4 py-2">
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
              className="min-h-[40vh] w-full flex-1 border-0"
            />
          </div>
        ) : null}
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="flex flex-col">
        <div className="border-ui-border-base border-b">{toolbar}</div>
        {body}
      </div>
    )
  }

  return (
    <FocusModal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose?.()
        }
      }}
    >
      <FocusModal.Content className="!max-w-[min(1200px,96vw)]">
        <FocusModal.Header>
          <FocusModal.Title asChild>
            <span className="sr-only">
              {entry
                ? t("cms.editor.content", { slug: entry.slug })
                : t("cms.editor.loading")}
            </span>
          </FocusModal.Title>
          <FocusModal.Description asChild>
            <span className="sr-only">
              {t("cms.editor.modalDescription", {
                defaultValue: "Edit site content fields, SEO, or raw JSON.",
              })}
            </span>
          </FocusModal.Description>
          {toolbar}
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-1 flex-col overflow-hidden p-0">
          {body}
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
