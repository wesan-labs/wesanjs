import { Container, Heading, Text, clx } from "@medusajs/ui"
import { ReactNode } from "react"
import { Sparkline } from "./sparkline"

export type StatAccent = "neutral" | "positive" | "negative"

type StatCardProps = {
  label: string
  value: ReactNode
  sub?: string
  accent?: StatAccent
  trend?: number[]
  size?: "default" | "hero"
}

const accentText: Record<StatAccent, string> = {
  neutral: "text-ui-fg-base",
  positive: "text-ui-tag-green-text",
  negative: "text-ui-tag-red-text",
}

const sparkColor: Record<StatAccent, string> = {
  neutral: "#3b82f6",
  positive: "#10b981",
  negative: "#ef4444",
}

// % change derived from the real trend series (first non-zero → last). null when
// there isn't enough signal — we never fabricate a delta.
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

export const StatCard = ({
  label,
  value,
  sub,
  accent = "neutral",
  trend,
  size = "default",
}: StatCardProps) => {
  const delta = pctDelta(trend)
  const hero = size === "hero"

  return (
    <Container className={clx("flex flex-col gap-y-2 p-6", hero && "gap-y-3")}>
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          {label}
        </Text>
        {delta != null ? (
          <span
            className={clx(
              "text-xs font-medium tabular-nums",
              delta >= 0 ? "text-ui-tag-green-text" : "text-ui-tag-red-text"
            )}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
          </span>
        ) : null}
      </div>

      <Heading
        level={hero ? "h1" : "h2"}
        className={clx(
          "tabular-nums",
          hero ? "text-4xl" : "text-2xl",
          accentText[accent]
        )}
      >
        {value}
      </Heading>

      {sub ? (
        <Text size="xsmall" className="text-ui-fg-muted">
          {sub}
        </Text>
      ) : null}

      {trend && trend.length > 1 ? (
        <Sparkline
          data={trend}
          color={sparkColor[accent]}
          height={hero ? 44 : 30}
        />
      ) : null}
    </Container>
  )
}
