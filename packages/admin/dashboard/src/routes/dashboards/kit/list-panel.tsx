import { Avatar, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { EmptyState } from "./states"

export type ListItem = {
  id: string
  title: string
  subtitle?: string
  meta?: ReactNode
  fallback?: string
}

type ListPanelProps = {
  items: ListItem[]
  isLoading?: boolean
  emptyLabel?: string
}

// Liste widget'ı: son müşteriler / reviews / son aktivite gibi her "öğe listesi".
export const ListPanel = ({
  items,
  isLoading,
  emptyLabel = "Kayıt yok",
}: ListPanelProps) => {
  if (!isLoading && items.length === 0) {
    return <EmptyState label={emptyLabel} />
  }

  return (
    <ul className="flex flex-col gap-y-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="hover:bg-ui-bg-subtle-hover flex items-center gap-x-3 rounded-md px-2 py-2"
        >
          <Avatar
            size="small"
            variant="rounded"
            fallback={item.fallback ?? item.title.slice(0, 1).toUpperCase()}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Text
              size="small"
              weight="plus"
              leading="compact"
              className="text-ui-fg-base truncate"
            >
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text
                size="xsmall"
                leading="compact"
                className="text-ui-fg-subtle truncate"
              >
                {item.subtitle}
              </Text>
            ) : null}
          </div>
          {item.meta ? (
            <Text size="xsmall" className="text-ui-fg-muted shrink-0">
              {item.meta}
            </Text>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
