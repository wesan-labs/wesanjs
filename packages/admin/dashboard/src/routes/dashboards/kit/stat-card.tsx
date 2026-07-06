import { Container, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { Sparkline } from "./sparkline"

export type StatAccent = "neutral" | "positive" | "negative"

const SPARKLINE_HEIGHT = 28

type StatCardProps = {
  label: string
  value: ReactNode
  sub?: string
  accent?: StatAccent
  trend?: number[]
  // Açık delta — verilirse trend'den hesaplanan yüzde yerine bu kullanılır
  // (ör. "Bugün" kartı: bugün vs dün, aylık trend değil). null = delta gösterme.
  delta?: number | null
}

// Inline-style colors → no dependency on Tailwind token class existence.
const accentColor: Record<StatAccent, string | undefined> = {
  neutral: undefined,
  positive: "#10b981",
  negative: "#ef4444",
}
const sparkColor: Record<StatAccent, string> = {
  neutral: "#6b7280",
  positive: "#10b981",
  negative: "#ef4444",
}

// % change from the real trend series (first non-zero → last). null = not enough
// signal; we never fabricate a delta.
const pctDelta = (trend?: number[]): number | null => {
  if (!trend || trend.length < 2) {
    return null
  }
  const first = trend.find((n) => n !== 0)
  const last = trend[trend.length - 1]
  if (first == null || first === 0) {
    return null
  }
  return ((last - first) / Math.abs(first)) * 100
}

// Compact, uniform KPI card. Sparkline slot is always reserved so cards in the
// same grid row stay the same height.
export const StatCard = ({
  label,
  value,
  sub,
  accent = "neutral",
  trend,
  delta: deltaProp,
}: StatCardProps) => {
  const delta = deltaProp !== undefined ? deltaProp : pctDelta(trend)
  const showSparkline = !!(trend && trend.length > 1)

  return (
    <Container className="flex h-full min-h-[108px] flex-col p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-y-1.5">
        <div className="flex items-center justify-between gap-x-2">
          <Text
            size="xsmall"
            weight="plus"
            className="text-ui-fg-subtle truncate uppercase tracking-wider"
          >
            {label}
          </Text>
          {delta != null ? (
            <span
              className="shrink-0 text-xs tabular-nums"
              style={{ color: delta >= 0 ? "#10b981" : "#ef4444" }}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
            </span>
          ) : null}
        </div>

        <div
          className="text-lg font-semibold tabular-nums leading-tight sm:text-xl"
          style={{ color: accentColor[accent] }}
        >
          {value}
        </div>

        {sub ? (
          <Text size="xsmall" className="text-ui-fg-muted mt-auto truncate">
            {sub}
          </Text>
        ) : null}
      </div>

      <div className="mt-2 shrink-0" style={{ height: SPARKLINE_HEIGHT }}>
        {showSparkline ? (
          <Sparkline data={trend!} color={sparkColor[accent]} height={SPARKLINE_HEIGHT} />
        ) : null}
      </div>
    </Container>
  )
}
