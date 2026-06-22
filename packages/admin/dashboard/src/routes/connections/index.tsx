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
import { ReactNode, useState } from "react"
import {
  useApps,
  useCreateApp,
  useCreateSource,
  useDeleteApp,
  useDeleteSource,
  useIntegrations,
  useSources,
  type RevApp,
  type RevSource,
} from "../../hooks/api/apps"

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Text
    size="xsmall"
    weight="plus"
    className="text-ui-fg-muted px-1 pt-2 uppercase tracking-wider"
  >
    {children}
  </Text>
)

const EnvVars = ({ vars }: { vars: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {vars.map((v) => (
      <code
        key={v}
        className="bg-ui-bg-component text-ui-fg-subtle rounded px-1.5 py-0.5 text-xs"
      >
        {v}
      </code>
    ))}
  </div>
)

const ProviderCard = ({
  title,
  connected,
  note,
  vars,
  extra,
}: {
  title: string
  connected?: boolean
  note?: string
  vars?: string[]
  extra?: ReactNode
}) => (
  <Container className="flex flex-col gap-y-3 p-5">
    <div className="flex items-center justify-between">
      <Heading level="h3">{title}</Heading>
      <Badge size="2xsmall" color={connected ? "green" : "grey"}>
        {connected ? "bağlı" : "bağlı değil"}
      </Badge>
    </div>
    {note ? (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {note}
      </Text>
    ) : null}
    {vars?.length ? <EnvVars vars={vars} /> : null}
    {extra}
  </Container>
)

const AppCard = ({ app, sources }: { app: RevApp; sources: RevSource[] }) => {
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
    <Container className="flex flex-col gap-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Heading level="h3">{app.name}</Heading>
          <Badge size="2xsmall" color={appSources.length ? "green" : "orange"}>
            {appSources.length} kaynak
          </Badge>
        </div>
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
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-52 flex-col gap-y-1">
          <Label size="xsmall">RevenueCat project_id</Label>
          <Input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="proj…" />
        </div>
        <div className="flex w-52 flex-col gap-y-1">
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
  const { integrations } = useIntegrations()
  const { apps } = useApps()
  const { sources } = useSources()
  const createApp = useCreateApp()
  const [name, setName] = useState("")

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Container className="p-6">
        <Heading level="h2">Entegrasyonlar</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Gelir kaynakları ve servisler. Secret değerler <code>helm/.env</code>'de
          tutulur — burada yalnız bağlantı eşlemesi ve durum.
        </Text>
      </Container>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ProviderCard
          title="RevenueCat"
          connected={integrations?.revenuecat.connected}
          note="Abonelik geliri — her ürün ayrı proje. Anahtarlar app başına aşağıda."
          extra={
            <Text size="xsmall" className="text-ui-fg-muted">
              {integrations?.revenuecat.apps ?? 0} app ·{" "}
              {integrations?.revenuecat.sources ?? 0} kaynak
            </Text>
          }
        />
        <ProviderCard
          title="AdMob"
          connected={integrations?.admob.connected}
          note={integrations?.admob.note}
          vars={integrations?.admob.envVars}
        />
        <ProviderCard
          title="Email"
          connected={integrations?.email.connected}
          note={integrations?.email.note}
          vars={integrations?.email.envVars}
          extra={
            <Text size="xsmall" className="text-ui-fg-muted">
              alıcı: {integrations?.email.recipient ?? "—"}
            </Text>
          }
        />
      </div>

      <SectionLabel>Uygulama Bağlantıları</SectionLabel>
      <Container className="flex flex-wrap items-end gap-3 p-5">
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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} sources={sources} />
          ))}
        </div>
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
