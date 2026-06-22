import { Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Text,
} from "@medusajs/ui"
import { useState } from "react"
import {
  useApps,
  useCreateApp,
  useCreateSource,
  useDeleteApp,
  useDeleteSource,
  useSources,
  type RevApp,
  type RevSource,
} from "../../hooks/api/apps"

const AppCard = ({
  app,
  sources,
}: {
  app: RevApp
  sources: RevSource[]
}) => {
  const createSource = useCreateSource()
  const deleteSource = useDeleteSource()
  const deleteApp = useDeleteApp()
  const [pid, setPid] = useState("")
  const [ref, setRef] = useState("")

  const appSources = sources.filter((s) => s.app_id === app.id)
  const addSource = () =>
    createSource.mutate(
      {
        type: "revenuecat",
        name: `${app.name} · RevenueCat`,
        app_id: app.id,
        external_id: pid.trim(),
        credentials_ref: ref.trim(),
      },
      { onSuccess: () => { setPid(""); setRef("") } }
    )

  return (
    <Container className="flex flex-col gap-y-4 p-6">
      <div className="flex items-center justify-between">
        <Heading level="h3">{app.name}</Heading>
        <IconButton
          size="small"
          variant="transparent"
          onClick={() => deleteApp.mutate(app.id)}
        >
          <Trash className="text-ui-fg-muted" />
        </IconButton>
      </div>

      {appSources.length ? (
        <div className="flex flex-col divide-y">
          {appSources.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2">
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-x-2">
                  <Badge size="2xsmall" color="blue">
                    {s.type}
                  </Badge>
                  <Text size="small" className="truncate">
                    {s.external_id || "—"}
                  </Text>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted">
                  key: {s.credentials_ref || "—"}
                  {s.last_error ? ` · hata: ${s.last_error}` : ""}
                </Text>
              </div>
              <IconButton
                size="small"
                variant="transparent"
                onClick={() => deleteSource.mutate(s.id)}
              >
                <Trash className="text-ui-fg-muted" />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        <Text size="xsmall" className="text-ui-fg-muted">
          Bu ürün için kaynak yok
        </Text>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-56 flex-col gap-y-1">
          <Label size="xsmall">RevenueCat project_id</Label>
          <Input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="proj…" />
        </div>
        <div className="flex w-56 flex-col gap-y-1">
          <Label size="xsmall">.env anahtar adı</Label>
          <Input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="REVENUECAT_KEY_EMPIRE"
          />
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={addSource}
          isLoading={createSource.isPending}
          disabled={!pid.trim() || !ref.trim()}
        >
          RevenueCat bağla
        </Button>
      </div>
    </Container>
  )
}

export const Component = () => {
  const { apps } = useApps()
  const { sources } = useSources()
  const createApp = useCreateApp()
  const [name, setName] = useState("")

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Container className="p-6">
        <Heading level="h2">Bağlantılar</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Her ürünü ekle, gelir kaynağını (RevenueCat projesi) bağla. Secret key
          DB'ye yazılmaz — anahtarı <code>helm/.env</code>'e koy (örn.
          <code> REVENUECAT_KEY_EMPIRE=sk_…</code>) ve buraya o değişkenin adını
          yaz.
        </Text>
      </Container>

      <Container className="flex flex-wrap items-end gap-3 p-6">
        <div className="flex min-w-64 flex-1 flex-col gap-y-1">
          <Label size="xsmall">Yeni ürün adı</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Empire Inc."
          />
        </div>
        <Button
          onClick={() =>
            createApp.mutate(
              { name: name.trim() },
              { onSuccess: () => setName("") }
            )
          }
          isLoading={createApp.isPending}
          disabled={!name.trim()}
        >
          Ürün Ekle
        </Button>
      </Container>

      {apps.length ? (
        apps.map((app) => (
          <AppCard key={app.id} app={app} sources={sources} />
        ))
      ) : (
        <Container className="p-6">
          <Text size="small" className="text-ui-fg-muted">
            Henüz ürün yok — yukarıdan ekle.
          </Text>
        </Container>
      )}
    </div>
  )
}
