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
  useSync,
  useUpdateApp,
  type RevApp,
  type RevSource,
} from "../../hooks/api/apps"

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Text
    size="xsmall"
    weight="plus"
    className="text-ui-fg-muted px-1 pt-3 uppercase tracking-wider"
  >
    {children}
  </Text>
)

/* ---- per-app: integrations live INSIDE the product card ---- */
const AppCard = ({ app, sources }: { app: RevApp; sources: RevSource[] }) => {
  const createSource = useCreateSource()
  const deleteSource = useDeleteSource()
  const deleteApp = useDeleteApp()
  const updateApp = useUpdateApp()

  const [pid, setPid] = useState("")
  const [secret, setSecret] = useState("")
  const [admobId, setAdmobId] = useState(
    (app.external_ids?.admob as string) ?? ""
  )

  const appSources = sources.filter((s) => s.app_id === app.id)
  const connected = appSources.some((s) => s.hasSecret)

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
    <Container className="flex flex-col gap-y-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Heading level="h3">{app.name}</Heading>
          <Badge size="2xsmall" color={connected ? "green" : "orange"}>
            {connected ? "bağlı" : "kurulum"}
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

      {/* Abonelik · RevenueCat */}
      <div className="flex flex-col gap-y-2">
        <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
          Abonelik · RevenueCat
        </Text>
        {appSources.map((s) => (
          <div
            key={s.id}
            className="bg-ui-bg-subtle flex items-center justify-between rounded-md px-3 py-2"
          >
            <div className="flex min-w-0 flex-col">
              <Text size="small" className="truncate">
                {s.external_id || "—"} ·{" "}
                {s.hasSecret ? "anahtar kayıtlı ✓" : "anahtar yok"}
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
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-44 flex-col gap-y-1">
            <Label size="xsmall">project_id</Label>
            <Input
              size="small"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              placeholder="proj…"
            />
          </div>
          <div className="flex w-44 flex-col gap-y-1">
            <Label size="xsmall">secret key</Label>
            <Input
              size="small"
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
            Bağla
          </Button>
        </div>
      </div>

      {/* Reklam · AdMob (eşleme) */}
      <div className="flex flex-col gap-y-2 border-t border-ui-border-base pt-3">
        <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
          Reklam · AdMob{" "}
          <span className="text-ui-fg-muted normal-case">
            (hesap aşağıda; burada app eşlemesi)
          </span>
        </Text>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-60 flex-col gap-y-1">
            <Label size="xsmall">AdMob app id (opsiyonel)</Label>
            <Input
              size="small"
              value={admobId}
              onChange={(e) => setAdmobId(e.target.value)}
              placeholder="ca-app-pub-…  (boşsa isimle eşleşir)"
            />
          </div>
          <Button
            size="small"
            variant="secondary"
            isLoading={updateApp.isPending}
            onClick={() =>
              updateApp.mutate({
                id: app.id,
                external_ids: {
                  ...(app.external_ids ?? {}),
                  admob: admobId.trim(),
                },
              })
            }
          >
            Kaydet
          </Button>
        </div>
      </div>
    </Container>
  )
}

/* ---- account-level services (entered once) ---- */
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
        <Heading level="h3">AdMob hesabı</Heading>
        <Badge size="2xsmall" color={connected ? "green" : "grey"}>
          {connected ? "bağlı" : "bağlı değil"}
        </Badge>
      </div>
      <Text size="xsmall" className="text-ui-fg-subtle">
        Tek hesap, OAuth. Gelir app'lere yukarıdan eşlenir.
        {publisherId ? ` · pub: ${publisherId}` : ""}
      </Text>
      <Input size="small" value={f.publisher_id} onChange={(e) => setF({ ...f, publisher_id: e.target.value })} placeholder="publisher id (pub-…)" />
      <Input size="small" value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })} placeholder="client id" />
      <Input size="small" type="password" value={f.client_secret} onChange={(e) => setF({ ...f, client_secret: e.target.value })} placeholder="client secret" />
      <Input size="small" type="password" value={f.refresh_token} onChange={(e) => setF({ ...f, refresh_token: e.target.value })} placeholder="refresh token" />
      <Button
        size="small"
        variant="secondary"
        isLoading={save.isPending}
        disabled={!valid}
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
                setF({ publisher_id: "", client_id: "", client_secret: "", refresh_token: "" }),
            }
          )
        }
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
      <Input size="small" value={f.recipient} onChange={(e) => setF({ ...f, recipient: e.target.value })} placeholder="alıcı e-mail" />
      <Input size="small" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} placeholder="gönderen (reports@…)" />
      <Input size="small" type="password" value={f.api_key} onChange={(e) => setF({ ...f, api_key: e.target.value })} placeholder="Resend API key (re_…)" />
      <Button
        size="small"
        variant="secondary"
        isLoading={save.isPending}
        disabled={!valid}
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
      >
        Kaydet
      </Button>
    </Container>
  )
}

export const Component = () => {
  const { integrations } = useIntegrations()
  const { apps } = useApps()
  const { sources } = useSources()
  const createApp = useCreateApp()
  const sync = useSync()
  const [name, setName] = useState("")

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Container className="flex flex-col gap-y-3 p-6">
        <div className="flex items-start justify-between gap-x-4">
          <div>
            <Heading level="h2">Entegrasyonlar</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Her ürünü ekle ve gelir kaynaklarını ürün altında bağla.
              Anahtarlar şifreli saklanır — <code>.env</code> gerekmez.
            </Text>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-y-1">
            <Button
              variant="secondary"
              size="small"
              isLoading={sync.isPending}
              onClick={() => sync.mutate()}
            >
              Şimdi senkronla
            </Button>
            {sync.data ? (
              <Text size="xsmall" className="text-ui-fg-muted">
                abonelik {sync.data.revenuecat.synced} · reklam{" "}
                {sync.data.admob.synced}
              </Text>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-64 flex-1 flex-col gap-y-1">
            <Label size="xsmall">Yeni ürün</Label>
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
        </div>
      </Container>

      <SectionLabel>Ürünler</SectionLabel>
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

      <SectionLabel>Servis Hesapları (bir kez)</SectionLabel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
    </div>
  )
}
