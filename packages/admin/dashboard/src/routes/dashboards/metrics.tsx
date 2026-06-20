import { Badge, Container, Heading, Text } from "@medusajs/ui"

// Domain dashboard'ları için paylaşılan yapı taşları. Gerçek veri sonra
// bağlanacak; şimdilik örnek değerlerle çalışan iskelet.

export type Metric = {
  label: string
  value: string
  sub?: string
}

export const DashboardHeader = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) => {
  return (
    <Container className="flex items-center justify-between p-6">
      <div>
        <Heading level="h2">{title}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {subtitle}
        </Text>
      </div>
      <Badge size="2xsmall" color="orange">
        Örnek veri · kaynak bağlı değil
      </Badge>
    </Container>
  )
}

export const MetricGrid = ({ metrics }: { metrics: Metric[] }) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Container key={metric.label} className="flex flex-col gap-y-2 p-6">
          <Text size="small" weight="plus" className="text-ui-fg-subtle">
            {metric.label}
          </Text>
          <Heading level="h1">{metric.value}</Heading>
          {metric.sub ? (
            <Text size="xsmall" className="text-ui-fg-muted">
              {metric.sub}
            </Text>
          ) : null}
        </Container>
      ))}
    </div>
  )
}
