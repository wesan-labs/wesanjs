import { useState } from "react"
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
import { EntryEditor } from "./components/entry-editor"
import { SchemaDesigner } from "./components/schema-designer"
import type { CollectionSchema } from "./lib/schema"

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
  const [schemaOpen, setSchemaOpen] = useState(false)
  const [draftSchema, setDraftSchema] = useState<CollectionSchema>({
    fields: [],
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["cms-sites"],
    queryFn: () => sdk.client.fetch<{ sites: CmsSite[] }>("/admin/cms/sites"),
  })

  const { data: detail } = useQuery({
    queryKey: ["cms-site", selectedId],
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
      setSchemaOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error?.message || t("cms.schemaModal.saveError"))
    },
  })

  const sites = data?.sites ?? []

  // Site detayı türevleri — seçili koleksiyon + onun entry'leri (gerçek alanlar).
  const collections = detail?.collections ?? []
  const allEntries = detail?.entries ?? []
  const entryCount = (cid: string) =>
    allEntries.filter((e) => e.collection_id === cid).length
  const activeColl =
    collections.find((c) => c.id === selectedCollId) ?? collections[0] ?? null
  const activeEntries = activeColl
    ? allEntries.filter((e) => e.collection_id === activeColl.id)
    : []
  const singletonEntry =
    activeColl?.kind === "singleton" ? activeEntries[0] : undefined

  // Önizleme URL'i: site base_url + draft-mode secret. base_url admin-girdisi →
  // iframe src'ine koymadan önce ŞEMAYI DOĞRULA (javascript:/data: → XSS engeli).
  // Sadece http/https geçerli; aksi halde önizleme kapalı.
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
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">{t("cms.sites.title")}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("cms.sites.hint")}
            </Text>
          </div>
          <Button size="small" onClick={() => setOpen(true)}>
            {t("cms.sites.newSite")}
          </Button>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-subtle">{t("cms.sites.loading")}</Text>
          </div>
        ) : sites.length === 0 ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-subtle">{t("cms.sites.empty")}</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("cms.sites.name")}</Table.HeaderCell>
                <Table.HeaderCell>{t("cms.sites.slug")}</Table.HeaderCell>
                <Table.HeaderCell>{t("cms.sites.url")}</Table.HeaderCell>
                <Table.HeaderCell>{t("cms.sites.status")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sites.map((s) => (
                <Table.Row
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={clx("cursor-pointer", {
                    "bg-ui-bg-highlight": s.id === selectedId,
                  })}
                >
                  <Table.Cell>{s.name}</Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="font-mono">
                      {s.slug}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{s.base_url || "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={s.enabled ? "green" : "grey"}>
                      {s.enabled
                        ? t("cms.sites.active")
                        : t("cms.sites.disabled")}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      {selectedId && detail && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">
              {t("cms.detail.content", { name: detail.site.name })}
            </Heading>
          </div>

          <div className="px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <Text
                size="xsmall"
                weight="plus"
                className="text-ui-fg-muted uppercase tracking-wider"
              >
                {t("cms.detail.collections", { count: collections.length })}
              </Text>
              {activeColl ? (
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => {
                    setDraftSchema(activeColl.schema ?? { fields: [] })
                    setSchemaOpen(true)
                  }}
                >
                  {t("cms.detail.editSchema")}
                </Button>
              ) : null}
            </div>
            {collections.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle">
                {t("cms.detail.noCollections")}{" "}
                <code className="text-xs">
                  cd levios/helm && npx medusa exec ./src/scripts/ingest-cms.ts
                </code>
              </Text>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {collections.map((c) => {
                  const active = activeColl?.id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCollId(c.id)}
                      className={clx(
                        "flex flex-col gap-y-2 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-ui-border-interactive bg-ui-bg-base shadow-elevation-card-rest"
                          : "border-ui-border-base hover:bg-ui-bg-base-hover"
                      )}
                    >
                      <div className="flex items-center justify-between gap-x-2">
                        <Text size="small" weight="plus" className="truncate">
                          {c.label}
                        </Text>
                        <Badge
                          size="2xsmall"
                          color={c.kind === "singleton" ? "purple" : "blue"}
                        >
                          {c.kind}
                        </Badge>
                      </div>
                      <Text
                        size="xsmall"
                        className="text-ui-fg-muted font-mono"
                      >
                        {c.slug} ·{" "}
                        {t("cms.detail.records", { count: entryCount(c.id) })}
                      </Text>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {activeColl ? (
            <div className="px-6 py-4">
              {activeColl.kind === "singleton" ? (
                <div className="bg-ui-bg-subtle border-ui-border-base flex items-center justify-between gap-x-4 rounded-lg border p-4">
                  <div>
                    <div className="flex items-center gap-x-2">
                      <Text size="small" weight="plus">
                        {activeColl.label}
                      </Text>
                      <Badge size="2xsmall" color="purple">
                        {activeColl.kind}
                      </Badge>
                    </div>
                    <Text size="small" className="text-ui-fg-subtle mt-1">
                      {t("cms.detail.singletonNote")}
                    </Text>
                  </div>
                  {singletonEntry ? (
                    <Button
                      size="small"
                      onClick={() => setEditingEntryId(singletonEntry.id)}
                    >
                      {t("cms.detail.edit")}
                    </Button>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      {t("cms.detail.noRecord")}
                    </Text>
                  )}
                </div>
              ) : (
                <>
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
                            className="cursor-pointer"
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
                                  e.status === "published" ? "green" : "orange"
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
                </>
              )}
            </div>
          ) : null}
        </Container>
      )}

      {editingEntryId && (
        <EntryEditor
          entryId={editingEntryId}
          collectionId={activeColl?.id}
          schema={activeColl?.schema ?? null}
          previewUrl={previewUrl}
          onClose={() => setEditingEntryId(null)}
        />
      )}

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

      <FocusModal open={schemaOpen} onOpenChange={setSchemaOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  {t("cms.newSite.cancel")}
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                disabled={!activeColl}
                isLoading={saveCollSchema.isPending}
                onClick={() =>
                  activeColl &&
                  saveCollSchema.mutate({
                    id: activeColl.id,
                    schema: draftSchema,
                  })
                }
              >
                {t("cms.schemaModal.save")}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col items-center overflow-auto py-8">
            <div className="flex w-full max-w-3xl flex-col gap-y-4">
              <div>
                <Heading level="h2">
                  {t("cms.schemaModal.title", { label: activeColl?.label })}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("cms.schemaModal.hint")}
                </Text>
              </div>
              <SchemaDesigner value={draftSchema} onChange={setDraftSchema} />
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </div>
  )
}
