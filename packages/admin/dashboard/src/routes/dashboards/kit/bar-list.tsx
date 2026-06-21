import { Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { EmptyState } from "./states"

export type BarItem = {
  label: string
  value: number
  display: ReactNode
}

type BarListProps = {
  items: BarItem[]
  emptyLabel?: string
  color?: string
}

// Oranlı yatay bar listesi — "X'e göre Y" kırılımı. Bar genişliği = value / max.
export const BarList = ({
  items,
  emptyLabel = "Veri yok",
  color = "#3b82f6",
}: BarListProps) => {
  if (!items.length) {
    return <EmptyState label={emptyLabel} />
  }
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="flex flex-col gap-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-y-1.5">
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-base">
              {item.label}
            </Text>
            <Text
              size="small"
              weight="plus"
              className="text-ui-fg-base tabular-nums"
            >
              {item.display}
            </Text>
          </div>
          <div className="bg-ui-bg-component h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, 2)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
