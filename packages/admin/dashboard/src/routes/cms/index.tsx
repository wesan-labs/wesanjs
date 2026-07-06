import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Table,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { sdk } from "../../lib/client/client"
import { OrgSwitchHint } from "../../components/common/org-switch-hint/org-switch-hint"
import {
  PRIMARY_TENANT_SLUG,
  useActiveTenant,
  useTenantQueryKey,
} from "../../hooks/api/tenants"
import { EntryEditor } from "./components/entry-editor"
import { SchemaDesigner } from "./components/schema-designer"
import { SectionNav, buildSections } from "./components/sectioned-form"
import { inferSchema, type CollectionSchema } from "./lib/schema"

type CmsSite = {
  id: string
  slug: string
  name: string
  base_url: string | null
  preview_secret: string | null
  enabled: boolean
}
type CmsCollection = {
  id: string
  slug: string
  label: string
  kind: string
  schema: CollectionSchema | null
}
type CmsEntry = {
  id: string
  collection_id: string
  slug: string
  locale: string
  status: string
}
type SiteDetail = {
  site: CmsSite
  collections: CmsCollection[]
  entries: CmsEntry[]
}

const EMPTY_FORM = { slug: "", name: "", base_url: "", preview_secret: "" }

export const Component = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCollId, setSelectedCollId] = useState<string | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [schemaExpanded, setSchemaExpanded] = useState(false)
  const [draftSchema, setDraftSchema] = useState<CollectionSchema>({
    fields: [],
  })
  const [autoOpenedEditor, setAutoOpenedEditor] = useState(false)
  const [editorMode, setEditorMode] = useState<"form" | "seo" | "json">("form")
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { activeTenant, tenants } = useActiveTenant()
  const primaryTenant = tenants.find((t) => t.slug === PRIMARY_TENANT_SLUG)
  const cmsSitesKey = useTenantQueryKey(["cms-sites"])
  const cmsSiteDetailKey = useTenantQueryKey(["cms-site", selectedId])

  const { data, isLoading } = useQuery({
    queryKey: cmsSitesKey,
    queryFn: () => sdk.client.fetch<{ sites: CmsSite[] }>("/admin/cms/sites"),
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: cmsSiteDetailKey,
    queryFn: () =>
      sdk.client.fetch<SiteDetail>(`/admin/cms/sites/${selectedId}`),
    enabled: !!selectedId,
  })

  const createSite = useMutation({
    mutationFn: (payload: typeof EMPTY_FORM) =>
      sdk.client.fetch("/admin/cms/sites", { method: "POST", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-sites"] })
      toast.success(t("cms.newSite.created"))
      setOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (error: Error) => {
      toast.error(error?.message || t("cms.newSite.createError"))
    },
  })

  const saveCollSchema = useMutation({
    mutationFn: (vars: { id: string; schema: CollectionSchema }) =>
      sdk.client.fetch(`/admin/cms/collections/${vars.id}`, {
        method: "POST",
        body: { schema: vars.schema },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-site"] })
      toast.success(t("cms.schemaModal.saved"))
      setSchemaExpanded(false)
    },
    onError: (error: Error) => {
      toast.error(error?.message || t("cms.schemaModal.saveError"))
    },
  })

  const sites = data?.sites ?? []
  const onCmsHomeOrg =
    !isLoading &&
    !sites.length &&
    !!primaryTenant &&
    activeTenant?.id !== primaryTenant.id

  const collections = detail?.collections ?? []
  const allEntries = detail?.entries ?? []
  const activeColl =
    collections.find((c) => c.id === selectedCollId) ?? collections[0] ?? null
  const activeEntries = activeColl
    ? allEntries.filter((e) => e.collection_id === activeColl.id)
    : []

  const { data: entryRes } = useQuery({
    queryKey: ["cms-entry", editingEntryId],
    queryFn: () =>
      sdk.client.fetch<{ entry: { data: Record<string, unknown> } }>(
        `/admin/cms/entries/${editingEntryId}`
      ),
    enabled: !!editingEntryId,
  })

  const hasAuthoredSchema = !!activeColl?.schema?.fields?.length

  const workingSchema = useMemo<CollectionSchema>(() => {
    if (hasAuthoredSchema && activeColl?.schema) {
      return activeColl.schema
    }
    const data = entryRes?.entry?.data
    if (data && Object.keys(data).length > 0) {
      return inferSchema(data)
    }
    return { fields: [] }
  }, [activeColl?.schema, entryRes?.entry?.data, hasAuthoredSchema])

  const contentSections = useMemo(
    () => buildSections(workingSchema, t),
    [workingSchema, t]
  )

  useEffect(() => {
    if (schemaExpanded) {
      setDraftSchema(workingSchema)
    }
  }, [schemaExpanded, workingSchema])

  useEffect(() => {
    if (!selectedId && sites.length > 0) {
      setSelectedId(sites[0].id)
    }
  }, [sites, selectedId])

  useEffect(() => {
    if (detail && collections.length > 0 && !selectedCollId) {
      setSelectedCollId(collections[0].id)
    }
  }, [detail, collections, selectedCollId])

  useEffect(() => {
    setAutoOpenedEditor(false)
    setSchemaExpanded(false)
    setEditorMode("form")
    setActiveSectionKey(null)
  }, [selectedId])

  useEffect(() => {
    setEditorMode("form")
    setActiveSectionKey(null)
  }, [editingEntryId])

  useEffect(() => {
    if (!detail || editingEntryId || autoOpenedEditor) {
      return
    }
    const singleton = collections.find((c) => c.kind === "singleton")
    if (!singleton) {
      return
    }
    const entry = allEntries.find((e) => e.collection_id === singleton.id)
    if (entry) {
      setSelectedCollId(singleton.id)
      setEditingEntryId(entry.id)
      setAutoOpenedEditor(true)
    }
  }, [
    detail,
    collections,
    allEntries,
    editingEntryId,
    autoOpenedEditor,
  ])

  const openCollection = (c: CmsCollection) => {
    setSelectedCollId(c.id)
    setSchemaExpanded(false)
    if (c.kind === "singleton") {
      const entry = allEntries.find((e) => e.collection_id === c.id)
      if (entry) {
        setEditingEntryId(entry.id)
      }
    } else {
      setEditingEntryId(null)
    }
  }

  const openSchemaEditor = () => {
    setDraftSchema(workingSchema)
    setSchemaExpanded(true)
  }

  const previewUrl = (() => {
    const raw = detail?.site.base_url
    if (!raw) {
      return null
    }
    let u: URL
    try {
      u = new URL(raw)
    } catch {
      return null
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null
    }
    u.searchParams.set("preview", detail?.site.preview_secret ?? "")
    return u.toString()
  })()

  return (
    <div className="flex flex-col gap-y-3">
      <OrgSwitchHint
        show={onCmsHomeOrg}
        targetTenant={primaryTenant}
        activeTenant={activeTenant}
        title={t("cms.sites.wrongOrgTitle")}
        body={t("cms.sites.wrongOrgBody")}
        buttonLabel={t("cms.sites.wrongOrgAction")}
      />

      <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-stretch">
        <Container className="divide-y p-0 lg:sticky lg:top-3 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
          <div className="flex items-center justify-between gap-x-2 px-4 py-3">
            <Heading level="h2" className="text-base">
              {t("cms.sites.title")}
            </Heading>
            <Button size="small" onClick={() => setOpen(true)}>
              {t("cms.sites.newSite")}
            </Button>
          </div>

          {isLoading ? (
            <div className="px-4 py-6">
              <Text size="small" className="text-ui-fg-subtle">
                {t("cms.sites.loading")}
              </Text>
            </div>
          ) : sites.length === 0 ? (
            <div className="px-4 py-6">
              <Text size="small" className="text-ui-fg-subtle">
                {t("cms.sites.empty")}
              </Text>
            </div>
          ) : (
            <div className="flex flex-col gap-y-0.5 p-2">
              {sites.map((s) => {
                const active = s.id === selectedId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id)
                      setSelectedCollId(null)
                      setEditingEntryId(null)
                      setSchemaExpanded(false)
                    }}
                    className={clx(
                      "flex flex-col gap-y-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-ui-bg-base shadow-elevation-card-rest ring-1 ring-ui-border-interactive"
                        : "hover:bg-ui-bg-base-hover"
                    )}
                  >
                    <div className="flex items-center justify-between gap-x-2">
                      <Text size="small" weight="plus" className="truncate">
                        {s.name}
                      </Text>
                      <Badge
                        size="2xsmall"
                        color={s.enabled ? "green" : "grey"}
                      >
                        {s.enabled
                          ? t("cms.sites.active")
                          : t("cms.sites.disabled")}
                      </Badge>
                    </div>
                    <Text size="xsmall" className="text-ui-fg-muted truncate font-mono">
                      {s.slug}
                    </Text>
                    {s.base_url ? (
                      <Text size="xsmall" className="text-ui-fg-subtle truncate">
                        {s.base_url}
                      </Text>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          {editingEntryId &&
          editorMode === "form" &&
          contentSections.length > 0 ? (
            <div className="border-ui-border-base border-t px-3 py-3">
              <Text
                size="xsmall"
                weight="plus"
                className="text-ui-fg-muted mb-2 px-1 uppercase tracking-wider"
              >
                {t("cms.editor.contentSections")}
              </Text>
              <SectionNav
                sections={contentSections}
                activeKey={activeSectionKey}
                onChange={(key) => {
                  setActiveSectionKey(key)
                  setEditorMode("form")
                }}
              />
            </div>
          ) : null}
        </Container>

        <div className="flex min-w-0 flex-col gap-y-3">
          {!selectedId ? (
            <Container className="flex min-h-[200px] items-center justify-center p-6">
              <Text size="small" className="text-ui-fg-subtle">
                {t("cms.sites.hint")}
              </Text>
            </Container>
          ) : detailLoading || !detail ? (
            <Container className="p-6">
              <Text size="small" className="text-ui-fg-subtle">
                {t("cms.sites.loading")}
              </Text>
            </Container>
          ) : (
            <Container className="divide-y p-0">
              <div className="px-5 py-4">
                <Heading level="h2">{detail.site.name}</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {detail.site.base_url || t("cms.detail.noUrl")}
                </Text>
              </div>

              {collections.length > 1 ? (
                <div className="flex flex-wrap gap-2 px-5 py-3">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openCollection(c)}
                      className={clx(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        activeColl?.id === c.id
                          ? "border-ui-border-interactive bg-ui-bg-base text-ui-fg-base"
                          : "border-ui-border-base text-ui-fg-subtle hover:bg-ui-bg-base-hover"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {!activeColl ? (
                <div className="px-5 py-6">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("cms.detail.noCollections")}{" "}
                    <code className="text-xs">
                      cd levios/helm && npx medusa exec
                      ./src/scripts/ingest-cms.ts
                    </code>
                  </Text>
                </div>
              ) : (
                <>
                  <section className="px-5 py-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Text
                          size="xsmall"
                          weight="plus"
                          className="text-ui-fg-muted mb-1 uppercase tracking-wider"
                        >
                          {t("cms.detail.schemaSection")}
                        </Text>
                        <div className="flex flex-wrap items-center gap-2">
                          <Text size="small" weight="plus">
                            {activeColl.label}
                          </Text>
                          <Badge
                            size="2xsmall"
                            color={
                              activeColl.kind === "singleton" ? "purple" : "blue"
                            }
                          >
                            {activeColl.kind}
                          </Badge>
                          <Text size="xsmall" className="text-ui-fg-muted">
                            {hasAuthoredSchema
                              ? t("cms.editor.schema")
                              : t("cms.editor.inferredSchema")}
                            {" · "}
                            {t("cms.editor.fields", {
                              count: workingSchema.fields.length,
                            })}
                          </Text>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="small"
                          variant={schemaExpanded ? "primary" : "secondary"}
                          onClick={() =>
                            schemaExpanded
                              ? setSchemaExpanded(false)
                              : openSchemaEditor()
                          }
                        >
                          {schemaExpanded
                            ? t("cms.detail.hideSchema")
                            : t("cms.detail.editSchema")}
                        </Button>
                        {schemaExpanded ? (
                          <Button
                            size="small"
                            onClick={() =>
                              saveCollSchema.mutate({
                                id: activeColl.id,
                                schema: draftSchema,
                              })
                            }
                            isLoading={saveCollSchema.isPending}
                          >
                            {t("cms.schemaModal.save")}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {schemaExpanded ? (
                      <div className="border-ui-border-base rounded-lg border p-4">
                        <Text size="small" className="text-ui-fg-subtle mb-3">
                          {t("cms.schemaModal.hint")}
                        </Text>
                        <SchemaDesigner
                          value={draftSchema}
                          onChange={setDraftSchema}
                        />
                      </div>
                    ) : null}
                  </section>

                  {activeColl.kind !== "singleton" ? (
                    <section className="px-5 py-4">
                      <Text
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-muted mb-2 uppercase tracking-wider"
                      >
                        {t("cms.detail.entries", {
                          label: activeColl.label,
                          count: activeEntries.length,
                        })}
                      </Text>
                      {activeEntries.length === 0 ? (
                        <Text size="small" className="text-ui-fg-subtle">
                          {t("cms.detail.noEntries")}
                        </Text>
                      ) : (
                        <Table>
                          <Table.Header>
                            <Table.Row>
                              <Table.HeaderCell>
                                {t("cms.detail.slug")}
                              </Table.HeaderCell>
                              <Table.HeaderCell>
                                {t("cms.detail.locale")}
                              </Table.HeaderCell>
                              <Table.HeaderCell>
                                {t("cms.detail.status")}
                              </Table.HeaderCell>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {activeEntries.map((e) => (
                              <Table.Row
                                key={e.id}
                                onClick={() => setEditingEntryId(e.id)}
                                className={clx(
                                  "cursor-pointer",
                                  editingEntryId === e.id && "bg-ui-bg-base-hover"
                                )}
                              >
                                <Table.Cell>
                                  <Text size="small" className="font-mono">
                                    {e.slug}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>{e.locale.toUpperCase()}</Table.Cell>
                                <Table.Cell>
                                  <Badge
                                    size="2xsmall"
                                    color={
                                      e.status === "published"
                                        ? "green"
                                        : "orange"
                                    }
                                  >
                                    {e.status}
                                  </Badge>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table>
                      )}
                    </section>
                  ) : null}

                  {editingEntryId ? (
                    <section className="border-ui-border-base border-t">
                      <EntryEditor
                        inline
                        showSchemaBar={false}
                        externalSectionNav
                        entryId={editingEntryId}
                        collectionId={activeColl.id}
                        schema={
                          hasAuthoredSchema ? activeColl.schema : null
                        }
                        previewUrl={previewUrl}
                        mode={editorMode}
                        onModeChange={setEditorMode}
                        activeSectionKey={activeSectionKey}
                        onActiveSectionChange={(key) => {
                          setActiveSectionKey(key)
                          setEditorMode("form")
                        }}
                      />
                    </section>
                  ) : activeColl.kind === "singleton" ? (
                    <div className="px-5 py-6">
                      <Text size="small" className="text-ui-fg-subtle">
                        {t("cms.detail.noRecord")}
                      </Text>
                    </div>
                  ) : null}
                </>
              )}
            </Container>
          )}
        </div>
      </div>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={createSite.isPending}
                >
                  {t("cms.newSite.cancel")}
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                onClick={() => createSite.mutate(form)}
                isLoading={createSite.isPending}
              >
                {t("cms.newSite.save")}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col items-center overflow-auto py-8">
            <div className="flex w-full max-w-lg flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Label>{t("cms.newSite.name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("cms.newSite.namePh")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("cms.newSite.slug")}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={t("cms.newSite.slugPh")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("cms.newSite.siteUrl")}</Label>
                <Input
                  value={form.base_url}
                  onChange={(e) =>
                    setForm({ ...form, base_url: e.target.value })
                  }
                  placeholder={t("cms.newSite.siteUrlPh")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("cms.newSite.previewSecret")}</Label>
                <Input
                  value={form.preview_secret}
                  onChange={(e) =>
                    setForm({ ...form, preview_secret: e.target.value })
                  }
                  placeholder={t("cms.newSite.previewSecretPh")}
                />
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </div>
  )
}
