import { Badge, Text } from "@medusajs/ui"
import { ReactNode } from "react"

type ChartPanelProps = {
  children?: ReactNode
}

// Grafik kabuğu. Faz 1: placeholder. Faz 2'de Recharts grafiği AYNI kabuğa
// girer (izole swap) — kabuk yeniden kullanılabilir kalır.
export const ChartPanel = ({ children }: ChartPanelProps) => {
  if (children) {
    return <>{children}</>
  }

  return (
    <div className="border-ui-border-base flex h-48 flex-col items-center justify-center gap-y-2 rounded-lg border border-dashed">
      <Badge size="2xsmall" color="grey">
        Faz 2 · grafik
      </Badge>
      <Text size="small" className="text-ui-fg-muted">
        Recharts bağlanınca dolacak
      </Text>
    </div>
  )
}
