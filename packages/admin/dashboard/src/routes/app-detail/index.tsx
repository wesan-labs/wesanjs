import { Container, Heading, Text } from "@medusajs/ui"
import { Link, useParams } from "react-router-dom"
import { useAppDetail } from "../../hooks/api/apps"
import { BarList, Money, StatCard, Widget } from "../dashboards/kit"

export const Component = () => {
  const { id } = useParams()
  const { app, isLoading, isError } = useAppDetail(id ?? "")

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-muted">
          Yükleniyor…
        </Text>
      </Container>
    )
  }
  if (isError || !app) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-error">
          Uygulama bulunamadı.
        </Text>
      </Container>
    )
  }

  const platformItems = app.platforms.map((p) => ({
    label: `${p.platform} · ${p.source_type}`,
    value: p.revenue,
    display: <Money amount={p.revenue} currency={p.currency} />,
  }))

  return (
    <div className="flex flex-col gap-y-2">
      <Container className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">{app.name}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Uygulama detayı
            {app.lastSyncedDate ? ` · son sync ${app.lastSyncedDate}` : ""}
          </Text>
        </div>
        <Link to="/revenue" className="text-ui-fg-interactive text-sm">
          ← Revenue
        </Link>
      </Container>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard
          label="MRR"
          value={<Money amount={app.mrr} currency={app.currency} />}
        />
        <StatCard
          label="28g Gelir"
          value={<Money amount={app.revenue28d} currency={app.currency} />}
        />
        <StatCard
          label="Reklam Geliri"
          value={<Money amount={app.adRevenue} currency={app.currency} />}
        />
        <StatCard label="Abone" value={app.activeSubscriptions.toLocaleString()} />
        <StatCard
          label="Aktif Kullanıcı"
          value={app.activeUsers.toLocaleString()}
        />
      </div>

      <Widget title="Platform / Kaynak Kırılımı (gelir)">
        <BarList items={platformItems} emptyLabel="Platform verisi yok" />
      </Widget>
    </div>
  )
}
