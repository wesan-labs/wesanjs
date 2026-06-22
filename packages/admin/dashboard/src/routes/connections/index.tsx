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
  useSaveIntegration,
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

const AdMobCard = ({
  connected,
  publisherId,
}: {
  connected?: boolean
  publisherId?: string | null
}) => {
  const save = useSaveIntegration()
  const [f, setF] = useState({
    publisher_id: "",
    client_id: "",
    client_secret: "",
    refresh_token: "",
  })
  const valid =
    !!f.publisher_id && !!f.client_id && !!f.client_secret && !!f.refresh_token
  return (
    <Container className="flex flex-col gap-y-2 p-5">
      <div className="flex items-center justify-between">
        <Heading level="h3">AdMob</Heading>
        <Badge size="2xsmall" color={connected ? "green" : "grey"}>
          {connected ? "bağlı" : "bağlı değil"}
        </Badge>
      </div>
      <Text size="xsmall" className="text-ui-fg-subtle">
        Reklam geliri — tek hesap, per-app/platform.
        {publisherId ? ` · pub: ${publisherId}` : ""}
      </Text>
      <Input
        value={f.publisher_id}
        onChange={(e) => setF({ ...f, publisher_id: e.target.value })}
        placeholder="publisher id (pub-…)"
      />
      <Input
        value={f.client_id}
        onChange={(e) => setF({ ...f, client_id: e.target.value })}
        placeholder="client id"
      />
      <Input
        type="password"
        value={f.client_secret}
        onChange={(e) => setF({ ...f, client_secret: e.target.value })}
        placeholder="client secret"
      />
      <Input
        type="password"
        value={f.refresh_token}
        onChange={(e) => setF({ ...f, refresh_token: e.target.value })}
        placeholder="refresh token"
      />
      <Button
        size="small"
        variant="secondary"
        onClick={() =>
          save.mutate(
            {
              provider: "admob",
              category: "ads",
              config: { publisher_id: f.publisher_id.trim() },
              secrets: {
                client_id: f.client_id.trim(),
                client_secret: f.client_secret.trim(),
                refresh_token: f.refresh_token.trim(),
              },
            },
            {
              onSuccess: () =>
                setF({
                  publisher_id: "",
                  client_id: "",
                  client_secret: "",
                  refresh_token: "",
                }),
            }
          )
        }
        isLoading={save.isPending}
        disabled={!valid}
      >
        Kaydet
      </Button>
    </Container>
  )
}

const EmailCard = ({
  connected,
  recipient,
  from,
}: {
  connected?: boolean
  recipient?: string | null
  from?: string | null
}) => {
  const save = useSaveIntegration()
  const [f, setF] = useState({
    recipient: recipient ?? "",
    from: from ?? "",
    api_key: "",
  })
  const valid = !!f.recipient && !!f.api_key
  return (
    <Container className="flex flex-col gap-y-2 p-5">
      <div className="flex items-center justify-between">
        <Heading level="h3">Email</Heading>
        <Badge size="2xsmall" color={connected ? "green" : "grey"}>
          {connected ? "bağlı" : "bağlı değil"}
        </Badge>
      </div>
      <Text size="xsmall" className="text-ui-fg-subtle">
        Aylık P&L raporu (Resend).
      </Text>
      <Input
        value={f.recipient}
        onChange={(e) => setF({ ...f, recipient: e.target.value })}
        placeholder="alıcı e-mail"
      />
      <Input
        value={f.from}
        onChange={(e) => setF({ ...f, from: e.target.value })}
        placeholder="gönderen (reports@…)"
      />
      <Input
        type="password"
        value={f.api_key}
        onChange={(e) => setF({ ...f, api_key: e.target.value })}
        placeholder="Resend API key (re_…)"
      />
      <Button
        size="small"
        variant="secondary"
        onClick={() =>
          save.mutate(
            {
              provider: "resend",
              category: "mail",
              config: { recipient: f.recipient.trim(), from: f.from.trim() },
              secrets: { api_key: f.api_key.trim() },
            },
            { onSuccess: () => setF({ ...f, api_key: "" }) }
          )
        }
        isLoading={save.isPending}
        disabled={!valid}
      >
        Kaydet
      </Button>
    </Container>
  )
}

const AppCard = ({ app, sources }: { app: RevApp; sources: RevSource[] }) => {
  const createSource = useCreateSource()
  const deleteSource = useDeleteSource()
  const deleteApp = useDeleteApp()
  const [pid, setPid] = useState("")
  const [secret, setSecret] = useState("")

  const appSources = sources.filter((s) => s.app_id === app.id)
  const addSource = () =>
    createSource.mutate(
      {
        type: "revenuecat",
        name: `${app.name} · RevenueCat`,
        app_id: app.id,
        external_id: pid.trim(),
        secret: secret.trim(),
      },
      { onSuccess: () => { setPid(""); setSecret("") } }
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
                <Text size="xsmall" className="text-ui-fg-muted truncate">
                  anahtar: {s.hasSecret ? "kayıtlı ✓" : "yok"}
                </Text>
                {s.last_error ? (
                  <Text
                    size="xsmall"
                    className="text-ui-tag-red-text truncate"
                    title={s.last_error}
                  >
                    hata: {String(s.last_error).slice(0, 60)}
                  </Text>
                ) : null}
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
          <Label size="xsmall">Secret key</Label>
          <Input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="sk_…"
          />
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={addSource}
          isLoading={createSource.isPending}
          disabled={!pid.trim() || !secret.trim()}
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
          Gelir kaynakları ve servisler. Anahtarları buradan gir — şifreli
          saklanır (DB), <code>.env</code> gerekmez.
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
        <AdMobCard
          connected={integrations?.admob.connected}
          publisherId={integrations?.admob.publisherId}
        />
        <EmailCard
          connected={integrations?.email.connected}
          recipient={integrations?.email.recipient}
          from={integrations?.email.from}
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
