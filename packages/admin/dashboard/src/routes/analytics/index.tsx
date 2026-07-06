import { ArrowPath, Check, Plus, SquareTwoStack } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  useAnalyticsFunnel,
  useAnalyticsOverview,
  useAnalyticsProducts,
  useCreateAnalyticsProduct,
  useRotateBootstrapToken,
  useSyncAnalytics,
  useUpdateAnalyticsProduct,
  VERTICAL_LABELS,
  type AnalyticsVertical,
} from "../../hooks/api/analytics"
import { backendUrl } from "../../lib/client"
import { AreaChartPanel, EmptyState, StatCard } from "../dashboards/kit"

const formatPct = (value: number | null) =>
  value === null ? "—" : `${Math.round(value * 1000) / 10}%`

const verticalOptions: AnalyticsVertical[] = [
  "mobile_game",
  "mobile_app",
  "web",
]

const sdkSnippet = (ingestUrl: string, configUrl: string) => `// Levios analytics relay
const cfg = await fetch("${configUrl}", {
  headers: { Authorization: "Bearer <BOOTSTRAP_TOKEN>" },
}).then((r) => r.json())

await fetch("${ingestUrl}", {
  method: "POST",
  headers: {
    Authorization: "Bearer <BOOTSTRAP_TOKEN>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    event: "funnel_step_open",
    distinct_id: "user-123",
    properties: { screen: "home" },
  }),
})`

export const Component = () => {
  const { products, isLoading, isError } = useAnalyticsProducts()
  const [productId, setProductId] = useState<string>()
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const { overview, isLoading: overviewLoading } = useAnalyticsOverview(productId)
  const { funnel } = useAnalyticsFunnel(productId)
  const updateProduct = useUpdateAnalyticsProduct()
  const createProduct = useCreateAnalyticsProduct()
  const rotateToken = useRotateBootstrapToken()
  const syncAnalytics = useSyncAnalytics()
  const [newName, setNewName] = useState("")
  const [newVertical, setNewVertical] = useState<AnalyticsVertical>("mobile_app")
  const [showAddProduct, setShowAddProduct] = useState(false)

  const selected = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  useEffect(() => {
    if (!productId && products.length) {
      setProductId(products[0].id)
    }
  }, [products, productId])

  const configUrl = `${backendUrl}/analytics/v1/config`
  const ingestUrl = `${backendUrl}/analytics/v1/events`

  const copyToken = async () => {
    if (!freshToken) {
      return
    }
    await navigator.clipboard.writeText(freshToken)
    toast.success("Bootstrap token kopyalandı")
  }

  const onRotate = async () => {
    if (!productId) {
      return
    }
    const res = await rotateToken.mutateAsync(productId)
    setFreshToken(res.token)
    toast.success("Yeni bootstrap token oluşturuldu")
  }

  const onVerticalChange = async (vertical: AnalyticsVertical) => {
    if (!productId) {
      return
    }
    await updateProduct.mutateAsync({ id: productId, vertical })
    toast.success("Vertical güncellendi")
  }

  const onSync = async () => {
    const res = await syncAnalytics.mutateAsync()
    toast.success(
      `Sync tamamlandı · ${res.sync.metrics_written} metrik (${res.sync.mode})`
    )
  }

  const onCreateProduct = async () => {
    const name = newName.trim()
    if (!name) {
      toast.error("Ürün adı gerekli")
      return
    }
    const res = await createProduct.mutateAsync({
      name,
      vertical: newVertical,
    })
    setProductId(res.product.id)
    setNewName("")
    setShowAddProduct(false)
    toast.success("Ürün oluşturuldu")
  }

  const addProductForm = (
    <Container className="flex flex-col gap-y-4 p-5">
      <div className="flex flex-col gap-y-1">
        <Text size="small" weight="plus">
          Yeni ürün
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          Revenue ile aynı ürün satırı oluşturulur; vertical dashboard şablonunu
          belirler.
        </Text>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[220px] flex-1 flex-col gap-y-2">
          <Label size="small">Ürün adı</Label>
          <Input
            size="small"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Örn. Puzzle Quest"
          />
        </div>
        <div className="flex min-w-[200px] flex-col gap-y-2">
          <Label size="small">Vertical</Label>
          <Select
            value={newVertical}
            onValueChange={(v) => setNewVertical(v as AnalyticsVertical)}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {verticalOptions.map((v) => (
                <Select.Item key={v} value={v}>
                  {VERTICAL_LABELS[v]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <Button
          size="small"
          onClick={onCreateProduct}
          isLoading={createProduct.isPending}
        >
          <Plus className="mr-xsmall" />
          Ekle
        </Button>
      </div>
    </Container>
  )

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="flex flex-col gap-y-1 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-y-1">
            <Heading level="h1">Analytics</Heading>
            <Text size="small" className="text-ui-fg-subtle max-w-2xl">
              Levios analytics — event&apos;ler bizim DB&apos;de, panel snapshot
              üzerinden. SDK bootstrap token ile bağlanır; harici env yok.
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={onSync}
              isLoading={syncAnalytics.isPending}
            >
              <ArrowPath className="mr-xsmall" />
              Snapshot sync
            </Button>
            <Button variant="secondary" size="small" asChild>
              <Link to="/settings/connections">Ürün / entegrasyonlar</Link>
            </Button>
          </div>
        </div>
      </Container>

      {isLoading ? (
        <EmptyState label="Yükleniyor…" />
      ) : isError ? (
        <EmptyState label="Ürün listesi alınamadı" />
      ) : products.length === 0 ? (
        <>
          {addProductForm}
          <Container className="flex flex-col items-center gap-y-2 px-6 py-8">
            <Text size="small" className="text-ui-fg-muted text-center">
              Henüz ürün yok. Yukarıdaki formdan ilk ürününüzü ekleyin; ardından
              bootstrap token ile SDK bağlayın.
            </Text>
          </Container>
        </>
      ) : (
        <>
          {showAddProduct ? (
            addProductForm
          ) : (
            <Container className="flex justify-end p-3">
              <Button
                size="small"
                variant="secondary"
                onClick={() => setShowAddProduct(true)}
              >
                <Plus className="mr-xsmall" />
                Yeni ürün
              </Button>
            </Container>
          )}
          <Container className="flex flex-wrap items-end gap-4 p-5">
            <div className="flex min-w-[220px] flex-col gap-y-2">
              <Text size="small" weight="plus">
                Ürün
              </Text>
              <Select
                value={productId}
                onValueChange={(v) => {
                  setProductId(v)
                  setFreshToken(null)
                }}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Ürün seçin" />
                </Select.Trigger>
                <Select.Content>
                  {products.map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                      {p.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="flex min-w-[200px] flex-col gap-y-2">
              <Text size="small" weight="plus">
                Vertical
              </Text>
              <Select
                value={selected?.vertical ?? "mobile_app"}
                onValueChange={(v) => onVerticalChange(v as AnalyticsVertical)}
                disabled={!productId || updateProduct.isPending}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {verticalOptions.map((v) => (
                    <Select.Item key={v} value={v}>
                      {VERTICAL_LABELS[v]}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {selected ? (
              <Badge size="small" color="grey">
                {selected.bootstrap_token_hint
                  ? `token ···${selected.bootstrap_token_hint}`
                  : "bootstrap yok"}
              </Badge>
            ) : null}
          </Container>

          {overviewLoading ? (
            <EmptyState label="Metrikler yükleniyor…" />
          ) : overview ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard label="DAU" value={String(overview.dau)} />
                <StatCard
                  label="Event (gün)"
                  value={String(overview.event_count)}
                />
                <StatCard
                  label="Crash"
                  value={String(overview.crash_count)}
                />
                <StatCard
                  label="Crash-free"
                  value={formatPct(overview.crash_free_rate)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Container className="flex flex-col gap-y-3 p-5">
                  <Text size="small" weight="plus">
                    DAU trend (30g)
                  </Text>
                  {overview.dau_trend.length ? (
                    <AreaChartPanel
                      data={overview.dau_trend}
                      xKey="date"
                      yKey="value"
                      height={180}
                    />
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      Henüz snapshot yok. &quot;Snapshot sync&quot; ile özet
                      üretin veya SDK&apos;dan event gönderin.
                    </Text>
                  )}
                </Container>

                <Container className="flex flex-col gap-y-3 p-5">
                  <Text size="small" weight="plus">
                    Crash trend (30g)
                  </Text>
                  {overview.crash_trend.length ? (
                    <AreaChartPanel
                      data={overview.crash_trend}
                      xKey="date"
                      yKey="value"
                      height={180}
                      color="#ef4444"
                    />
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      Crash event&apos;leri ingest sonrası dolacak.
                    </Text>
                  )}
                </Container>
              </div>

              {funnel?.steps?.length ? (
                <Container className="flex flex-col gap-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text size="small" weight="plus">
                      Huni özeti
                      {funnel.date
                        ? ` · ${String(funnel.date).slice(0, 10)}`
                        : ""}
                    </Text>
                    <Badge size="2xsmall" color="grey">
                      {VERTICAL_LABELS[funnel.vertical]}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-y-3">
                    {funnel.steps.map((step, index) => (
                      <div key={step.key} className="flex flex-col gap-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <Text size="small" weight="plus">
                            {index + 1}. {step.label}
                          </Text>
                          <Text size="small" className="text-ui-fg-muted tabular-nums">
                            {step.value.toLocaleString()}{" "}
                            <span className="text-ui-fg-subtle">
                              ({formatPct(step.rate_from_top)})
                            </span>
                          </Text>
                        </div>
                        <div className="bg-ui-bg-component h-2 overflow-hidden rounded-full">
                          <div
                            className="bg-ui-fg-interactive h-full rounded-full transition-all"
                            style={{
                              width: `${Math.max(4, Math.round(step.rate_from_top * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Container>
              ) : null}
            </>
          ) : null}

          <Container className="flex flex-col gap-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-y-1">
                <Text size="small" weight="plus">
                  Bootstrap token
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  SDK runtime config:{" "}
                  <code className="text-ui-fg-base">{configUrl}</code>
                </Text>
              </div>
              <Button
                size="small"
                variant="secondary"
                onClick={onRotate}
                isLoading={rotateToken.isPending}
                disabled={!productId}
              >
                <ArrowPath className="mr-xsmall" />
                Token oluştur / rotate
              </Button>
            </div>

            {freshToken ? (
              <div className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-x-2">
                  <Check className="text-ui-tag-green-icon h-4 w-4" />
                  <Text size="small" weight="plus">
                    Token yalnızca bir kez gösterilir
                  </Text>
                </div>
                <code className="text-ui-fg-base break-all text-xs">
                  {freshToken}
                </code>
                <Button
                  size="small"
                  variant="transparent"
                  className="w-fit"
                  onClick={copyToken}
                >
                  <SquareTwoStack className="mr-xsmall h-4 w-4" />
                  Kopyala
                </Button>
              </div>
            ) : null}

            <pre className="bg-ui-bg-subtle text-ui-fg-subtle overflow-x-auto rounded-lg p-4 text-xs">
              {sdkSnippet(ingestUrl, configUrl)}
            </pre>
          </Container>
        </>
      )}
    </div>
  )
}
