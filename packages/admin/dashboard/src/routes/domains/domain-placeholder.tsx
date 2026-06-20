import { Badge, Container, Heading, Text } from "@medusajs/ui"

type DomainPlaceholderProps = {
  title: string
  description: string
  planned?: string[]
}

/**
 * Shared shell for domain groups whose backend module does not exist yet.
 * Keeps the nav navigable and documents the intended scope without faking a
 * working feature. Replace per-domain once a real module/data source lands.
 */
export const DomainPlaceholder = ({
  title,
  description,
  planned,
}: DomainPlaceholderProps) => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{title}</Heading>
        <Badge size="2xsmall" color="orange">
          Kabuk · backend modülü yok
        </Badge>
      </div>
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {description}
        </Text>
      </div>
      {planned?.length ? (
        <div className="px-6 py-4">
          <Text size="small" weight="plus" className="mb-2">
            Planlanan
          </Text>
          <ul className="text-ui-fg-subtle flex flex-col gap-y-1">
            {planned.map((item) => (
              <li key={item} className="text-sm">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Container>
  )
}
