import { Check, Plus, Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  IconButton,
  Input,
  Label,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { useState } from "react"
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

/* ---- single source of truth: columns are derived from this ---- */
type IntegrationDef = {
  key: string
  label: string
  mono: string
  category: string
  color: string
  bg: string
  available: boolean
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "revenuecat",
    label: "RevenueCat",
    mono: "RC",
    category: "Abonelik",
    color: "#E0483D",
    bg: "rgba(224,72,61,0.14)",
    available: true,
  },
  {
    key: "admob",
    label: "AdMob",
    mono: "Ad",
    category: "Reklam",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.14)",
    available: true,
  },
  {
    key: "applovin",
    label: "AppLovin",
    mono: "AL",
    category: "Reklam",
    color: "#14B8A6",
    bg: "rgba(20,184,166,0.14)",
    available: false,
  },
  {
    key: "sentry",
    label: "Sentry",
    mono: "Se",
    category: "Hata",
    color: "#7B51F8",
    bg: "rgba(123,81,248,0.14)",
    available: false,
  },
]

/* connection state per (app, integration) — read from existing data */
const isConnected = (app: RevApp, sources: RevSource[], key: string) => {
  if (key === "revenuecat")
    return sources.some(
      (s) => s.app_id === app.id && s.type === "revenuecat" && s.hasSecret
    )
  if (key === "admob") return !!(app.external_ids?.admob as string)
  return false
}

const valueHint = (app: RevApp, sources: RevSource[], key: string) => {
  if (key === "revenuecat")
    return (
      sources.find((s) => s.app_id === app.id && s.type === "revenuecat")
        ?.external_id ?? undefined
    )
  if (key === "admob") return (app.external_ids?.admob as string) || undefined
  return undefined
}

/* ---- brand glyph: lit = marka rengi, sönük = gri ---- */
const Glyph = ({
  integration,
  lit,
  size = 28,
}: {
  integration: IntegrationDef
  lit: boolean
  size?: number
}) => (
  <div
    className={
      "flex items-center justify-center rounded-md font-semibold transition-colors " +
      (lit ? "" : "bg-ui-bg-component text-ui-fg-disabled")
    }
    style={
      lit
        ? {
            width: size,
            height: size,
            backgroundColor: integration.bg,
            color: integration.color,
            fontSize: Math.round(size * 0.4),
          }
        : { width: size, height: size, fontSize: Math.round(size * 0.4) }
    }
  >
    {integration.mono}
  </div>
)

/* ---- one matrix cell: compact single line ---- */
const StatusDot = ({ integration }: { integration: IntegrationDef }) => (
  <div className="relative shrink-0">
    <Glyph integration={integration} lit size={20} />
    <span className="bg-ui-tag-green-bg ring-ui-bg-base absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2">
      <Check className="text-ui-tag-green-icon h-2.5 w-2.5" />
    </span>
  </div>
)

const MatrixCell = ({
  integration,
  connected,
  hint,
  onOpen,
}: {
  integration: IntegrationDef
  connected: boolean
  hint?: string
  onOpen: () => void
}) => {
  if (!integration.available) {
    return (
      <td className="w-44 px-3 py-1.5">
        <Tooltip content={`${integration.label} · yakında`}>
          <div className="flex items-center gap-x-2 opacity-40">
            <Glyph integration={integration} lit={false} size={20} />
            <Text size="xsmall" className="text-ui-fg-muted">
              yakında
            </Text>
          </div>
        </Tooltip>
      </td>
    )
  }

  return (
    <td className="w-44 px-3 py-1.5">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-x-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-ui-bg-base-hover"
      >
        {connected ? (
          <StatusDot integration={integration} />
        ) : (
          <Glyph integration={integration} lit={false} size={20} />
        )}
        <Text
          size="xsmall"
          className={
            "truncate " +
            (connected
              ? "text-ui-fg-subtle"
              : "text-ui-fg-muted group-hover:text-ui-fg-subtle")
          }
        >
          {connected ? hint || "bağlı" : "bağla"}
        </Text>
      </button>
    </td>
  )
}

/* ---- editor drawer: per (app, integration) ---- */
const RevenuecatBody = ({
  app,
  sources,
}: {
  app: RevApp
  sources: RevSource[]
}) => {
  const createSource = useCreateSource()
  const deleteSource = useDeleteSource()
  const [pid, setPid] = useState("")
  const [secret, setSecret] = useState("")
  const appSources = sources.filter(
    (s) => s.app_id === app.id && s.type === "revenuecat"
  )

  return (
    <div className="flex flex-col gap-y-4">
      {appSources.length ? (
        <div className="flex flex-col gap-y-2">
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
                    hata: {String(s.last_error).slice(0, 80)}
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

      <div className="flex flex-col gap-y-3">
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">project_id</Label>
          <Input
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            placeholder="proj…"
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">secret key</Label>
          <Input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="sk_…"
          />
          <Text size="xsmall" className="text-ui-fg-muted">
            Anahtar şifreli saklanır — <code>.env</code> gerekmez.
          </Text>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
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
          }
          isLoading={createSource.isPending}
          disabled={!pid.trim() || !secret.trim()}
        >
          Bağla
        </Button>
      </div>
    </div>
  )
}

const AdmobBody = ({
  app,
  accountConnected,
}: {
  app: RevApp
  accountConnected: boolean
}) => {
  const updateApp = useUpdateApp()
  const [admobId, setAdmobId] = useState(
    (app.external_ids?.admob as string) ?? ""
  )

  return (
    <div className="flex flex-col gap-y-4">
      {!accountConnected ? (
        <div className="bg-ui-tag-orange-bg rounded-md px-3 py-2">
          <Text size="xsmall" className="text-ui-tag-orange-text">
            AdMob hesabı henüz bağlı değil. Önce sayfanın altındaki{" "}
            <strong>Servisler → AdMob hesabı</strong> bölümünden hesabı bağla;
            burada sadece bu ürünün app eşlemesini yaparsın.
          </Text>
        </div>
      ) : null}
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">AdMob app id</Label>
        <Input
          value={admobId}
          onChange={(e) => setAdmobId(e.target.value)}
          placeholder="ca-app-pub-…  (boşsa isimle eşleşir)"
        />
        <Text size="xsmall" className="text-ui-fg-muted">
          Reklam geliri tek hesaptan gelir; bu id ile bu ürüne ayrıştırılır.
        </Text>
      </div>
      <div className="flex gap-x-2">
        <Button
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
        {app.external_ids?.admob ? (
          <Button
            variant="transparent"
            onClick={() => {
              setAdmobId("")
              updateApp.mutate({
                id: app.id,
                external_ids: { ...(app.external_ids ?? {}), admob: "" },
              })
            }}
          >
            Eşlemeyi kaldır
          </Button>
        ) : null}
      </div>
    </div>
  )
}

const IntegrationDrawer = ({
  app,
  integration,
  sources,
  accountAdmobConnected,
  onClose,
}: {
  app: RevApp
  integration: IntegrationDef
  sources: RevSource[]
  accountAdmobConnected: boolean
  onClose: () => void
}) => (
  <Drawer open onOpenChange={(o) => !o && onClose()}>
    <Drawer.Content>
      <Drawer.Header>
        <div className="flex items-center gap-x-3">
          <Glyph integration={integration} lit size={36} />
          <div className="flex flex-col">
            <Drawer.Title>{app.name}</Drawer.Title>
            <Text size="small" className="text-ui-fg-subtle">
              {integration.label} · {integration.category}
            </Text>
          </div>
        </div>
      </Drawer.Header>
      <Drawer.Body className="overflow-y-auto">
        {integration.key === "revenuecat" ? (
          <RevenuecatBody app={app} sources={sources} />
        ) : integration.key === "admob" ? (
          <AdmobBody app={app} accountConnected={accountAdmobConnected} />
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            Bu entegrasyon yakında eklenecek.
          </Text>
        )}
      </Drawer.Body>
    </Drawer.Content>
  </Drawer>
)

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
        Tek hesap, OAuth. Gelir app'lere matristen eşlenir.
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
  const deleteApp = useDeleteApp()
  const sync = useSync()
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<{
    app: RevApp
    integration: IntegrationDef
  } | null>(null)

  const activeCount = INTEGRATIONS.filter((i) => i.available).length
  const accountAdmobConnected = !!integrations?.admob.connected

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Container className="flex items-start justify-between gap-x-4 p-6">
        <div>
          <Heading level="h2">Entegrasyonlar</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Her satır bir ürün, her sütun bir entegrasyon. Bir hücreye tıkla,
            bağla. Anahtarlar şifreli saklanır.
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
      </Container>

      <Container className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-ui-border-base bg-ui-bg-subtle border-b">
                <th className="px-4 py-2.5 text-left">
                  <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                    Ürün
                  </Text>
                </th>
                {INTEGRATIONS.map((i) => (
                  <th key={i.key} className="w-44 px-3 py-2.5 text-left">
                    <Tooltip content={i.category}>
                      <div className="flex items-center gap-x-2">
                        <Glyph integration={i} lit size={18} />
                        <Text size="xsmall" weight="plus" className="text-ui-fg-base">
                          {i.label}
                        </Text>
                      </div>
                    </Tooltip>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => {
                const conn = INTEGRATIONS.filter(
                  (i) => i.available && isConnected(app, sources, i.key)
                ).length
                return (
                  <tr
                    key={app.id}
                    className="border-ui-border-base group border-b transition-colors hover:bg-ui-bg-base-hover/40"
                  >
                    <td className="px-4 py-1.5">
                      <div className="flex items-baseline gap-x-2">
                        <Text size="small" weight="plus" className="truncate">
                          {app.name}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-muted shrink-0">
                          {conn}/{activeCount}
                        </Text>
                      </div>
                    </td>
                    {INTEGRATIONS.map((i) => (
                      <MatrixCell
                        key={i.key}
                        integration={i}
                        connected={isConnected(app, sources, i.key)}
                        hint={valueHint(app, sources, i.key)}
                        onOpen={() => setEditing({ app, integration: i })}
                      />
                    ))}
                    <td className="px-2 text-center align-middle">
                      <IconButton
                        size="small"
                        variant="transparent"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => deleteApp.mutate(app.id)}
                      >
                        <Trash className="text-ui-fg-muted" />
                      </IconButton>
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={INTEGRATIONS.length + 2} className="px-5 py-3">
                  <div className="border-ui-border-strong flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2">
                    <Plus className="text-ui-fg-muted" />
                    <Input
                      size="small"
                      className="w-56"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Yeni ürün adı — Empire Inc."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && name.trim())
                          createApp.mutate(
                            { name: name.trim() },
                            { onSuccess: () => setName("") }
                          )
                      }}
                    />
                    <Button
                      size="small"
                      variant="secondary"
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {!apps.length ? (
          <div className="px-5 pb-5">
            <Text size="small" className="text-ui-fg-muted">
              Henüz ürün yok — yukarıdan ekle, sonra hücrelere tıklayıp bağla.
            </Text>
          </div>
        ) : null}
      </Container>

      <Text
        size="xsmall"
        weight="plus"
        className="text-ui-fg-muted px-1 pt-3 uppercase tracking-wider"
      >
        Servisler (bir kez)
      </Text>
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

      {editing ? (
        <IntegrationDrawer
          key={editing.app.id + editing.integration.key}
          app={editing.app}
          integration={editing.integration}
          sources={sources}
          accountAdmobConnected={accountAdmobConnected}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}
