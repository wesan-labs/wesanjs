import { Badge, Container, Heading, Text } from "@medusajs/ui"

type Metric = {
  label: string
  value: string
  sub: string
}

// Örnek değerler — gerçek metrikler revenue/usage modülü bağlanınca dolacak.
const METRICS: Metric[] = [
  { label: "MRR", value: "$0", sub: "Aylık yinelenen gelir" },
  { label: "ARR", value: "$0", sub: "Yıllık yinelenen gelir" },
  { label: "DAU", value: "0", sub: "Günlük aktif kullanıcı" },
  { label: "MAU", value: "0", sub: "Aylık aktif kullanıcı" },
]

export const Component = () => {
  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">Revenue</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Gelir ve kullanım metrikleri
          </Text>
        </div>
        <Badge size="2xsmall" color="orange">
          Örnek veri · kaynak bağlı değil
        </Badge>
      </Container>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => (
          <Container key={metric.label} className="flex flex-col gap-y-2 p-6">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              {metric.label}
            </Text>
            <Heading level="h1">{metric.value}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              {metric.sub}
            </Text>
          </Container>
        ))}
      </div>
    </div>
  )
}
