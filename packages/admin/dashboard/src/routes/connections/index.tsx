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
  Select,
  Text,
  Tooltip,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
  type Integrations,
  type RevApp,
  type RevSource,
} from "../../hooks/api/apps"
import {
  PRIMARY_TENANT_SLUG,
  setActiveTenantId,
  useActiveTenant,
} from "../../hooks/api/tenants"
import {
  useFinanceSettings,
  useSaveFinanceSettings,
  type FinanceSettings,
} from "../../hooks/api/revenue"
import { useSocialStatus } from "../../hooks/api/social"

/* ---- brand logos (simple-icons, viewBox 0 0 24 24, single path) ---- */
const ICON_REVENUECAT =
  "M4.3036.3999c-1.5246 0-3.2129.1508-4.303.4136v14.9997c.3083.1722.8432.28 1.5632.28.7404 0 1.2553-.1072 1.5433-.28v-5.2323a14.8588 14.8588 0 0 0 2.121.1512h.3294l2.8604 5.0588c.432.195 1.0288.3024 1.9348.3024.8033 0 1.38-.1104 1.6476-.3024l-3.437-5.8358c1.4195-.8004 2.326-2.2698 2.326-4.4964C10.8894 1.827 8.4232.4 4.3037.4zm15.4543 0c-1.3788 0-2.624.2707-3.6901.7945-2.4552 1.203-3.9609 3.7376-3.9609 7.3627 0 4.8245 2.6552 7.7155 7.1659 7.7155.9 0 1.5868-.3014 2.005.2554.4194.5568-.3582 1.2165-.7746 1.5105-1.6338 1.1544-5.7217-.1024-9.4908-.4804C5.5994 17.015.9264 16.3009.146 19.1928c-.4104 1.5264.1225 2.5013.6421 3.0503 1.044 1.1046 2.882 1.357 4.344 1.357a13.959 13.959 0 0 0 2.0508-.1558 1.311 1.311 0 0 0 1.023-.8063c.1674-.4254.0861-.904-.212-1.2562a1.3464 1.3464 0 0 0-1.2352-.4523c-1.5012.2706-3.6213.8685-4.4343.0105-.2748-.291-.2268-1.0037 0-1.2257.6048-.8748 4.493-.5393 8.4127-.0293 4.329.4344 8.4023 1.8609 10.945.6351.9955-.48 2.318-1.1941 2.318-3.792h-.0012c0-1.1473-.1489-2.274-.4476-3.3797-1.3818.1872-2.4783.2857-3.2883.2941-2.845 0-4.869-1.4484-4.869-5.0963 0-3.648 2.0461-5.1573 5.0179-5.1573 1.2011 0 2.129.2512 3.1405.7336.1062-.9234-.1058-2.1605-.5906-2.8523-.78-.4608-2.0014-.6703-3.2038-.6703zM4.51 3.1889c2.0579 0 3.2108.7111 3.2108 2.4421 0 1.6824-1.0912 2.3554-2.8816 2.3554a10.2838 10.2838 0 0 1-1.7706-.1511V3.3166a7.7782 7.7782 0 0 1 1.4413-.1277z"
const ICON_ADMOB =
  "M11.46.033h-.052A11.993 11.993 0 0 0 0 11.922v.052c0 7.475 6.563 11.928 11.447 11.928h.17a3.086 3.086 0 0 0 3.125-3.047c0-1.693-1.433-2.917-3.152-2.917h-.039a6.016 6.016 0 0 1-5.508-6.368v-.052a6.016 6.016 0 0 1 5.573-5.509c1.719 0 3.125-1.237 3.125-2.917A3.086 3.086 0 0 0 11.604.02h-.143zm2.031.026a3.516 3.516 0 0 1 1.746 3.021 3.386 3.386 0 0 1-1.928 3.047c2.865.6 4.532 3.126 4.688 5.378v7.684a3.49 3.49 0 0 1 6.003.026v-7.736A12.046 12.046 0 0 0 13.491.045zm7.475 17.932a2.995 2.995 0 1 0 .04 0z"

const CURRENCIES = ["USD", "EUR", "GBP", "TRY"]

/* ---- single source of truth: columns are derived from this ---- */
type IntegrationDef = {
  key: string
  label: string
  mono: string
  icon?: string
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
    icon: ICON_REVENUECAT,
    category: "Abonelik",
    color: "#E0483D",
    bg: "rgba(224,72,61,0.14)",
    available: true,
  },
  {
    key: "admob",
    label: "AdMob",
    mono: "Ad",
    icon: ICON_ADMOB,
    category: "Reklam",
    color: "#34A853",
    bg: "rgba(52,168,83,0.14)",
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
]

const ADMOB_DEF = INTEGRATIONS.find((i) => i.key === "admob") as IntegrationDef

const admobMapped = (app: RevApp) => {
  const e = app.external_ids ?? {}
  return !!(
    (e.admob_android as string) ||
    (e.admob_ios as string) ||
    (typeof e.admob === "string" && e.admob)
  )
}

/* connection state per (app, integration) — read from existing data */
const isConnected = (app: RevApp, sources: RevSource[], key: string) => {
  if (key === "revenuecat")
    return sources.some(
      (s) => s.app_id === app.id && s.type === "revenuecat" && s.hasSecret
    )
  if (key === "admob") return admobMapped(app)
  return false
}

/* ---- brand glyph: real logo (else monogram); lit = marka rengi, sönük = gri ---- */
const Glyph = ({
  integration,
  lit,
  size = 24,
}: {
  integration: IntegrationDef
  lit: boolean
  size?: number
}) => (
  <div
    className={
      "flex shrink-0 items-center justify-center rounded-md font-semibold transition-colors " +
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
    {integration.icon ? (
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        fill="currentColor"
        aria-hidden
      >
        <path d={integration.icon} />
      </svg>
    ) : (
      integration.mono
    )}
  </div>
)

/* ---- one matrix cell: icon-only, status via color + green check ---- */
const MatrixCell = ({
  integration,
  connected,
  onOpen,
}: {
  integration: IntegrationDef
  connected: boolean
  onOpen: () => void
}) => {
  if (!integration.available) {
    return (
      <td className="w-28 px-2 py-1.5 text-center">
        <Tooltip content={`${integration.label} · yakında`}>
          <span className="inline-flex opacity-40">
            <Glyph integration={integration} lit={false} size={26} />
          </span>
        </Tooltip>
      </td>
    )
  }

  return (
    <td className="w-28 px-2 py-1.5 text-center">
      <Tooltip
        content={`${integration.label} · ${connected ? "bağlı — düzenle" : "bağla"}`}
      >
        <button
          type="button"
          onClick={onOpen}
          className="group relative inline-flex rounded-md p-1 transition-colors hover:bg-ui-bg-base-hover"
        >
          <Glyph integration={integration} lit={connected} size={26} />
          {connected ? (
            <span className="bg-ui-tag-green-bg ring-ui-bg-base absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full ring-2">
              <Check className="text-ui-tag-green-icon h-2.5 w-2.5" />
            </span>
          ) : (
            <span className="bg-ui-bg-component text-ui-fg-muted ring-ui-bg-base absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full opacity-0 ring-2 transition-opacity group-hover:opacity-100">
              <Plus className="h-3 w-3" />
            </span>
          )}
        </button>
      </Tooltip>
    </td>
  )
}

/* ---- per-product editor drawer ---- */
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
                onClick={() =>
                  deleteSource.mutate(s.id, {
                    onSuccess: () => toast.success("Bağlantı kaldırıldı"),
                  })
                }
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
              {
                onSuccess: () => {
                  setPid("")
                  setSecret("")
                  toast.success("RevenueCat bağlandı")
                },
                onError: () => toast.error("Bağlanamadı"),
              }
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
  const ext = app.external_ids ?? {}
  const [android, setAndroid] = useState(
    (ext.admob_android as string) ||
      (typeof ext.admob === "string" ? (ext.admob as string) : "")
  )
  const [ios, setIos] = useState((ext.admob_ios as string) || "")

  const save = (a: string, i: string, msg: string) =>
    updateApp.mutate(
      {
        id: app.id,
        external_ids: {
          ...ext,
          admob_android: a.trim(),
          admob_ios: i.trim(),
          admob: "", // legacy tek-alan temizlenir
        },
      },
      {
        onSuccess: () => toast.success(msg),
        onError: () => toast.error("Kaydedilemedi"),
      }
    )

  return (
    <div className="flex flex-col gap-y-4">
      {!accountConnected ? (
        <div className="bg-ui-tag-orange-bg rounded-md px-3 py-2">
          <Text size="xsmall" className="text-ui-tag-orange-text">
            AdMob hesabı henüz bağlı değil. Önce üstteki{" "}
            <strong>AdMob hesabı</strong> butonundan hesabı bağla; burada her
            platformun app id'sini eşlersin.
          </Text>
        </div>
      ) : null}

      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">Android app id</Label>
        <Input
          value={android}
          onChange={(e) => setAndroid(e.target.value)}
          placeholder="ca-app-pub-…~android"
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">iOS (Apple) app id</Label>
        <Input
          value={ios}
          onChange={(e) => setIos(e.target.value)}
          placeholder="ca-app-pub-…~ios"
        />
        <Text size="xsmall" className="text-ui-fg-muted">
          Reklam geliri tek hesaptan gelir; her platform kendi id'siyle bu ürüne
          ayrıştırılır. Boş bıraktığın platform isimle eşleşmeye düşer.
        </Text>
      </div>

      <div className="flex gap-x-2">
        <Button
          variant="secondary"
          isLoading={updateApp.isPending}
          disabled={!android.trim() && !ios.trim()}
          onClick={() => save(android, ios, "AdMob eşlemesi kaydedildi")}
        >
          Kaydet
        </Button>
        {admobMapped(app) ? (
          <Button
            variant="transparent"
            onClick={() => {
              setAndroid("")
              setIos("")
              save("", "", "Eşleme kaldırıldı")
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

/* ---- account-level services ---- */
/* write-only secret: kayıtlıysa "•••• kayıtlı" gösterir, boş bırakılırsa korunur */
const SecretField = ({
  value,
  onChange,
  label,
  saved,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  saved: boolean
}) => (
  <div className="flex flex-col gap-y-1">
    <Label size="xsmall">{label}</Label>
    <Input
      size="small"
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={saved ? "•••••••• kayıtlı — değiştirmek için yaz" : label}
    />
    {saved ? (
      <Text size="xsmall" className="text-ui-tag-green-text">
        kayıtlı ✓
      </Text>
    ) : null}
  </div>
)

const StorageNote = () => (
  <Text size="xsmall" className="text-ui-fg-muted">
    Şifreli olarak veritabanında saklanır (revenue_source.secret_enc). Güvenlik
    için anahtarlar geri gösterilmez; alanı boş bırakırsan mevcut değer korunur.
  </Text>
)

const AdmobAccountForm = ({
  connected,
  publisherId,
  currency,
  secretsSet = [],
}: {
  connected?: boolean
  publisherId?: string | null
  currency?: string | null
  secretsSet?: string[]
}) => {
  const save = useSaveIntegration()
  const [f, setF] = useState({
    publisher_id: publisherId ?? "",
    currency: currency ?? "USD",
    client_id: "",
    client_secret: "",
    refresh_token: "",
  })
  const has = (k: string) => secretsSet.includes(k)
  const valid = connected
    ? !!f.publisher_id.trim()
    : !!f.publisher_id.trim() &&
      !!f.client_id.trim() &&
      !!f.client_secret.trim() &&
      !!f.refresh_token.trim()

  return (
    <div className="flex flex-col gap-y-3">
      <Text size="xsmall" className="text-ui-fg-subtle">
        Tek hesap, OAuth. Gelir app'lere matristen eşlenir.
      </Text>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">publisher id</Label>
        <Input size="small" value={f.publisher_id} onChange={(e) => setF({ ...f, publisher_id: e.target.value })} placeholder="pub-…" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">Rapor para birimi</Label>
        <Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v })}>
          <Select.Trigger>
            <Select.Value placeholder="Para birimi" />
          </Select.Trigger>
          <Select.Content>
            {CURRENCIES.map((c) => (
              <Select.Item key={c} value={c}>
                {c}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Text size="xsmall" className="text-ui-fg-muted">
          AdMob raporu bu birimde gelir — TRY/USD karışıklığını önler.
        </Text>
      </div>
      <SecretField value={f.client_id} onChange={(v) => setF({ ...f, client_id: v })} label="client id" saved={has("client_id")} />
      <SecretField value={f.client_secret} onChange={(v) => setF({ ...f, client_secret: v })} label="client secret" saved={has("client_secret")} />
      <SecretField value={f.refresh_token} onChange={(v) => setF({ ...f, refresh_token: v })} label="refresh token" saved={has("refresh_token")} />
      <StorageNote />
      <Button
        size="small"
        variant="secondary"
        isLoading={save.isPending}
        disabled={!valid}
        onClick={() => {
          const secrets: Record<string, string> = {}
          if (f.client_id.trim()) secrets.client_id = f.client_id.trim()
          if (f.client_secret.trim()) secrets.client_secret = f.client_secret.trim()
          if (f.refresh_token.trim()) secrets.refresh_token = f.refresh_token.trim()
          save.mutate(
            {
              provider: "admob",
              category: "ads",
              config: { publisher_id: f.publisher_id.trim(), currency: f.currency },
              secrets,
            },
            {
              onSuccess: () => {
                toast.success("AdMob hesabı kaydedildi")
                setF((s) => ({ ...s, client_id: "", client_secret: "", refresh_token: "" }))
              },
              onError: () => toast.error("Kaydedilemedi"),
            }
          )
        }}
      >
        Kaydet
      </Button>
    </div>
  )
}

const EmailAccountForm = ({
  connected,
  recipient,
  from,
  secretsSet = [],
}: {
  connected?: boolean
  recipient?: string | null
  from?: string | null
  secretsSet?: string[]
}) => {
  const save = useSaveIntegration()
  const [f, setF] = useState({
    recipient: recipient ?? "",
    from: from ?? "",
    api_key: "",
  })
  const hasKey = secretsSet.includes("api_key")
  const valid = connected
    ? !!f.recipient.trim()
    : !!f.recipient.trim() && !!f.api_key.trim()

  return (
    <div className="flex flex-col gap-y-3">
      <Text size="xsmall" className="text-ui-fg-subtle">
        Aylık P&L raporu (Resend).
      </Text>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">alıcı e-mail</Label>
        <Input size="small" value={f.recipient} onChange={(e) => setF({ ...f, recipient: e.target.value })} placeholder="can@…" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="xsmall">gönderen</Label>
        <Input size="small" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} placeholder="reports@…" />
      </div>
      <SecretField value={f.api_key} onChange={(v) => setF({ ...f, api_key: v })} label="Resend API key (re_…)" saved={hasKey} />
      <StorageNote />
      <Button
        size="small"
        variant="secondary"
        isLoading={save.isPending}
        disabled={!valid}
        onClick={() => {
          const secrets: Record<string, string> = {}
          if (f.api_key.trim()) secrets.api_key = f.api_key.trim()
          save.mutate(
            {
              provider: "resend",
              category: "mail",
              config: { recipient: f.recipient.trim(), from: f.from.trim() },
              secrets,
            },
            {
              onSuccess: () => {
                toast.success("Email kaydedildi")
                setF((s) => ({ ...s, api_key: "" }))
              },
              onError: () => toast.error("Kaydedilemedi"),
            }
          )
        }}
      >
        Kaydet
      </Button>
    </div>
  )
}

/* finans ayarları: platform komisyonları + vergi oranı (%) */
const PctField = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) => (
  <div className="flex flex-col gap-y-1">
    <Label size="xsmall">{label}</Label>
    <div className="relative">
      <Input
        size="small"
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="pr-7"
      />
      <span className="text-ui-fg-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
        %
      </span>
    </div>
    {hint ? (
      <Text size="xsmall" className="text-ui-fg-muted">
        {hint}
      </Text>
    ) : null}
  </div>
)

const FinanceForm = ({ initial }: { initial?: FinanceSettings }) => {
  const save = useSaveFinanceSettings()
  const [f, setF] = useState({
    apple: initial?.appleCommission ? String(initial.appleCommission) : "",
    google: initial?.googleCommission ? String(initial.googleCommission) : "",
    other: initial?.otherCommission ? String(initial.otherCommission) : "",
    tax: initial?.taxRate ? String(initial.taxRate) : "",
  })
  return (
    <div className="flex flex-col gap-y-3">
      <Text size="xsmall" className="text-ui-fg-subtle">
        Apple/Google IAP komisyonu abonelik gelirinden, vergi ise komisyon+gider
        sonrası kârdan düşülür. Reklam geliri zaten net gelir.
      </Text>
      <PctField label="Apple komisyonu" hint="App Store IAP (genelde 15–30)" value={f.apple} onChange={(v) => setF({ ...f, apple: v })} />
      <PctField label="Google komisyonu" hint="Play Store IAP (genelde 15–30)" value={f.google} onChange={(v) => setF({ ...f, google: v })} />
      <PctField label="Diğer komisyon" hint="Web/Stripe vb." value={f.other} onChange={(v) => setF({ ...f, other: v })} />
      <div className="border-ui-border-base border-t pt-3">
        <PctField label="Vergi oranı" hint="Kâr üzerinden (gelir vergisi/stopaj)" value={f.tax} onChange={(v) => setF({ ...f, tax: v })} />
      </div>
      <Button
        size="small"
        variant="secondary"
        isLoading={save.isPending}
        onClick={() =>
          save.mutate(
            {
              apple_commission: Number(f.apple) || 0,
              google_commission: Number(f.google) || 0,
              other_commission: Number(f.other) || 0,
              tax_rate: Number(f.tax) || 0,
            },
            {
              onSuccess: () => toast.success("Finans ayarları kaydedildi"),
              onError: () => toast.error("Kaydedilemedi"),
            }
          )
        }
      >
        Kaydet
      </Button>
    </div>
  )
}

/* account creds open in a side drawer from the top buttons */
const AccountDrawer = ({
  kind,
  integrations,
  onClose,
}: {
  kind: "admob" | "email" | "finance"
  integrations?: Integrations
  onClose: () => void
}) => {
  const admob = integrations?.admob
  const email = integrations?.email
  const { settings: finance } = useFinanceSettings()

  const meta = {
    admob: { title: "AdMob hesabı", sub: "Reklam · tek hesap (OAuth)" },
    email: { title: "Email", sub: "Aylık P&L · Resend" },
    finance: { title: "Finans", sub: "Komisyon + vergi" },
  }[kind]
  const connected =
    kind === "admob"
      ? !!admob?.connected
      : kind === "email"
        ? !!email?.connected
        : undefined

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <div className="flex w-full items-center gap-x-3">
            {kind === "admob" ? (
              <Glyph integration={ADMOB_DEF} lit size={36} />
            ) : (
              <div className="bg-ui-bg-component text-ui-fg-base flex h-9 w-9 items-center justify-center rounded-md text-base">
                {kind === "email" ? "✉" : "₺"}
              </div>
            )}
            <div className="flex flex-col">
              <Drawer.Title>{meta.title}</Drawer.Title>
              <Text size="small" className="text-ui-fg-subtle">
                {meta.sub}
              </Text>
            </div>
            {connected !== undefined ? (
              <Badge size="2xsmall" color={connected ? "green" : "grey"} className="ml-auto">
                {connected ? "bağlı" : "bağlı değil"}
              </Badge>
            ) : null}
          </div>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto">
          {kind === "admob" ? (
            <AdmobAccountForm
              key={`af:${admob?.publisherId ?? ""}:${admob?.currency ?? ""}:${
                admob?.secretsSet?.join(",") ?? ""
              }`}
              connected={admob?.connected}
              publisherId={admob?.publisherId}
              currency={admob?.currency}
              secretsSet={admob?.secretsSet}
            />
          ) : kind === "email" ? (
            <EmailAccountForm
              key={`ef:${email?.recipient ?? ""}:${email?.from ?? ""}:${
                email?.secretsSet?.join(",") ?? ""
              }`}
              connected={email?.connected}
              recipient={email?.recipient}
              from={email?.from}
              secretsSet={email?.secretsSet}
            />
          ) : (
            <FinanceForm
              key={`fin:${finance?.appleCommission ?? ""}:${
                finance?.googleCommission ?? ""
              }:${finance?.otherCommission ?? ""}:${finance?.taxRate ?? ""}`}
              initial={finance}
            />
          )}
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X",
  x: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  youtube: "YouTube",
  threads: "Threads",
}

const SocialOrgSection = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useSocialStatus()

  if (isLoading) {
    return (
      <Container className="p-5">
        <Text size="small" className="text-ui-fg-muted">
          Sosyal medya durumu yükleniyor…
        </Text>
      </Container>
    )
  }

  if (!data) {
    return null
  }

  const profileLabel = data.profile?.name || data.profile?.id?.slice(0, 8) || "—"

  return (
    <Container className="flex flex-col gap-y-4 p-5">
      <div className="flex flex-col gap-y-2 sm:flex-row sm:items-start sm:justify-between sm:gap-x-4">
        <div>
          <Heading level="h2">Sosyal medya</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Bu organizasyonun Zernio profili ve bağlı hesaplar. Platform anahtarı
            Levios operatörü tarafından yönetilir — müşteri <code>.env</code>{" "}
            doldurmaz.
          </Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          className="shrink-0"
          onClick={() => navigate("/social-media")}
        >
          Sosyal medyaya git
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          size="2xsmall"
          color={data.platformSocial ? "green" : "red"}
        >
          {data.platformSocial ? "Platform anahtarı aktif" : "Platform anahtarı yok"}
        </Badge>
        <Badge
          size="2xsmall"
          color={data.configured ? "green" : "orange"}
        >
          {data.configured ? "Org profili hazır" : "Profil bekleniyor"}
        </Badge>
        {data.profile?.shared ? (
          <Badge size="2xsmall" color="orange">
            Paylaşımlı profil (dev / free tier)
          </Badge>
        ) : null}
        <Badge
          size="2xsmall"
          color={data.imageHost ? "green" : "grey"}
        >
          {data.imageHost
            ? "Görsel yükleme hazır"
            : "Görsel yükleme kapalı"}
        </Badge>
      </div>

      {data.profile ? (
        <Text size="small" className="text-ui-fg-subtle">
          Profil:{" "}
          <span className="text-ui-fg-base font-medium">{profileLabel}</span>
          {data.accountCount > 0
            ? ` · ${data.accountCount} bağlı hesap`
            : " · henüz bağlı hesap yok"}
        </Text>
      ) : null}

      {data.accounts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.accounts.map((a) => (
            <Badge key={`${a.platform}-${a.username}`} size="2xsmall">
              {SOCIAL_PLATFORM_LABELS[a.platform.toLowerCase()] || a.platform}
              {a.username ? ` @${a.username}` : ""}
            </Badge>
          ))}
        </div>
      ) : data.configured ? (
        <Text size="xsmall" className="text-ui-fg-muted">
          Instagram, TikTok vb. bağlamak için Sosyal medya sayfasından OAuth
          başlatın.
        </Text>
      ) : !data.platformSocial ? (
        <Text size="xsmall" className="text-ui-fg-muted">
          Levios operatörü sunucuda <code>ZERNIO_API_KEY</code> tanımlamalı.
        </Text>
      ) : null}

      {!data.imageHost ? (
        <Text size="xsmall" className="text-ui-fg-muted">
          Stüdyodan görsel yayınlamak için operatör{" "}
          <code>IMAGE_HOST</code> (imgbb, cloudinary veya r2) yapılandırmalı;
          aksi halde yalnızca public URL ile yayın yapılır.
        </Text>
      ) : null}
    </Container>
  )
}

const AccountButton = ({
  label,
  connected,
  onClick,
}: {
  label: string
  connected: boolean
  onClick: () => void
}) => (
  <Button variant="secondary" size="small" onClick={onClick}>
    <span
      className={
        "mr-1.5 inline-block h-2 w-2 rounded-full " +
        (connected ? "bg-ui-tag-green-icon" : "bg-ui-fg-disabled")
      }
    />
    {label}
  </Button>
)

export const Component = () => {
  const { integrations } = useIntegrations()
  const { apps } = useApps()
  const { sources } = useSources()
  const { activeTenant, tenants } = useActiveTenant()
  const primaryTenant = tenants.find((t) => t.slug === PRIMARY_TENANT_SLUG)
  const onWrongOrg =
    !!primaryTenant && activeTenant?.id !== primaryTenant.id && !apps.length
  const createApp = useCreateApp()
  const deleteApp = useDeleteApp()
  const sync = useSync()
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<{
    app: RevApp
    integration: IntegrationDef
  } | null>(null)
  const [accountDrawer, setAccountDrawer] = useState<
    "admob" | "email" | "finance" | null
  >(null)
  const { settings: finance } = useFinanceSettings()

  const activeCount = INTEGRATIONS.filter((i) => i.available).length
  const accountAdmobConnected = !!integrations?.admob.connected
  const financeSet = !!(
    finance &&
    (finance.appleCommission ||
      finance.googleCommission ||
      finance.otherCommission ||
      finance.taxRate)
  )

  const addApp = () =>
    createApp.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName("")
          toast.success("Ürün eklendi")
        },
      }
    )

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Container className="flex flex-col gap-y-3 p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-x-4">
        <div>
          <Heading level="h2">Entegrasyonlar</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Her satır bir ürün, her sütun bir entegrasyon. Bir hücreye tıkla,
            bağla. Anahtarlar şifreli saklanır.
          </Text>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AccountButton
            label="AdMob hesabı"
            connected={!!integrations?.admob.connected}
            onClick={() => setAccountDrawer("admob")}
          />
          <AccountButton
            label="Email"
            connected={!!integrations?.email.connected}
            onClick={() => setAccountDrawer("email")}
          />
          <AccountButton
            label="Finans"
            connected={financeSet}
            onClick={() => setAccountDrawer("finance")}
          />
          <div className="flex flex-col items-end gap-y-1">
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
      </Container>

      {onWrongOrg ? (
        <Container className="border-ui-border-interactive bg-ui-bg-subtle flex flex-col gap-y-3 border p-5">
          <Text size="small" weight="plus">
            Entegrasyonlar başka organizasyonda
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Ürünler ve bağlantılar{" "}
            <span className="text-ui-fg-base font-medium">
              {primaryTenant?.name ?? "Wesan"}
            </span>{" "}
            org&apos;unda. Şu an{" "}
            <span className="text-ui-fg-base font-medium">
              {activeTenant?.name}
            </span>{" "}
            seçili — bu yüzden liste boş görünüyor. Veri silinmedi.
          </Text>
          <div>
            <Button
              size="small"
              onClick={() => primaryTenant && setActiveTenantId(primaryTenant.id)}
            >
              {primaryTenant?.name ?? "Wesan"} org&apos;una geç
            </Button>
          </div>
        </Container>
      ) : null}

      <SocialOrgSection />

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
                  <th key={i.key} className="w-28 px-2 py-2.5 text-center">
                    <Tooltip content={i.category}>
                      <div className="flex items-center justify-center gap-x-1.5">
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
                        onOpen={() => setEditing({ app, integration: i })}
                      />
                    ))}
                    <td className="px-2 text-center align-middle">
                      <IconButton
                        size="small"
                        variant="transparent"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() =>
                          deleteApp.mutate(app.id, {
                            onSuccess: () => toast.success("Ürün silindi"),
                          })
                        }
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
                        if (e.key === "Enter" && name.trim()) addApp()
                      }}
                    />
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={addApp}
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

      {accountDrawer ? (
        <AccountDrawer
          key={accountDrawer}
          kind={accountDrawer}
          integrations={integrations}
          onClose={() => setAccountDrawer(null)}
        />
      ) : null}
    </div>
  )
}
