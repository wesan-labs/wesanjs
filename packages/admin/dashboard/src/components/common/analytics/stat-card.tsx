import { Text, clx } from "@medusajs/ui"

const TREND_GREEN = "#10B981"
const TREND_RED = "#EF4444"

export interface StatCardProps {
  label: string
  value: string
  /** small muted context line, shown when no trend is given */
  sub?: string
  /** colored ▲/▼ pill — pass when a real comparison exists */
  trend?: { up: boolean; text: string }
  loading?: boolean
  className?: string
}

/**
 * KPI tile: label, large value, and either a trend pill or a context line.
 * Token-based so it themes (light/dark) with the rest of the admin.
 */
export const StatCard = ({
  label,
  value,
  sub,
  trend,
  loading,
  className,
}: StatCardProps) => (
  <div
    className={clx(
      "border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-2 rounded-xl border p-4",
      className
    )}
  >
    <Text size="xsmall" className="text-ui-fg-muted">
      {label}
    </Text>
    <Text size="xlarge" weight="plus" className="tabular-nums leading-none">
      {loading ? "···" : value}
    </Text>
    {trend ? (
      <span
        className="flex w-fit items-center gap-x-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
        style={{
          color: trend.up ? TREND_GREEN : TREND_RED,
          backgroundColor: (trend.up ? TREND_GREEN : TREND_RED) + "1a",
        }}
      >
        {trend.up ? "▲" : "▼"} {trend.text}
      </span>
    ) : sub ? (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {sub}
      </Text>
    ) : null}
  </div>
)
