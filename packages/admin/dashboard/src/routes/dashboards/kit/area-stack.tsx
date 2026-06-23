import { Text } from "@medusajs/ui"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const AXIS = "#71717a"
const GRID = "#3f3f4633"

type Series = { key: string; label: string; color: string }

type Props = {
  data: Array<Record<string, unknown>>
  xKey: string
  series: Series[]
  height?: number
  valueFormatter?: (v: number) => string
}

const StackTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
  series,
}: any) => {
  if (!active || !payload?.length) {
    return null
  }
  return (
    <div className="bg-ui-bg-base border-ui-border-base shadow-elevation-tooltip min-w-[160px] rounded-lg border px-3 py-2">
      <Text size="xsmall" className="text-ui-fg-muted mb-1">
        {label}
      </Text>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-x-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: p.color }}
          />
          <Text size="xsmall" className="text-ui-fg-subtle">
            {series.find((s: Series) => s.key === p.dataKey)?.label ?? p.dataKey}
          </Text>
          <Text
            size="xsmall"
            weight="plus"
            className="text-ui-fg-base tabular-nums ml-auto"
          >
            {valueFormatter ? valueFormatter(p.value) : p.value}
          </Text>
        </div>
      ))}
    </div>
  )
}

// Çok seri yığılmış alan grafiği (gradient fill) — günlük platform kırılımı için.
export const StackedAreaChart = ({
  data,
  xKey,
  series,
  height = 240,
  valueFormatter,
}: Props) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.key} id={`stk-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
          </linearGradient>
        ))}
      </defs>
      <CartesianGrid stroke={GRID} vertical={false} />
      <XAxis
        dataKey={xKey}
        stroke={AXIS}
        tick={{ fontSize: 11, fill: AXIS }}
        tickLine={false}
        axisLine={false}
        minTickGap={24}
      />
      <YAxis
        stroke={AXIS}
        tick={{ fontSize: 11, fill: AXIS }}
        tickLine={false}
        axisLine={false}
        width={44}
        tickFormatter={valueFormatter}
      />
      <Tooltip
        content={<StackTooltip valueFormatter={valueFormatter} series={series} />}
        cursor={{ stroke: GRID }}
      />
      {series.map((s) => (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          stackId="1"
          stroke={s.color}
          strokeWidth={1.5}
          fill={`url(#stk-${s.key})`}
        />
      ))}
    </AreaChart>
  </ResponsiveContainer>
)
