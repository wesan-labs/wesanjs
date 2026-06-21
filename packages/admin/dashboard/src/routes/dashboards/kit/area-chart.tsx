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

type AreaChartPanelProps = {
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  color?: string
  height?: number
  valueFormatter?: (v: number) => string
}

// Neutral grays read fine on light + dark; chart internals stay theme-stable.
const AXIS = "#71717a"
const GRID = "#3f3f4633"

const ThemedTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  valueFormatter?: (v: number) => string
}) => {
  if (!active || !payload?.length) {
    return null
  }
  const v = payload[0].value
  return (
    <div className="bg-ui-bg-base border-ui-border-base shadow-elevation-tooltip rounded-lg border px-3 py-2">
      <Text size="xsmall" className="text-ui-fg-muted">
        {label}
      </Text>
      <Text size="small" weight="plus" className="text-ui-fg-base tabular-nums">
        {valueFormatter ? valueFormatter(v) : v}
      </Text>
    </div>
  )
}

// Temalı alan grafiği (shadcn Charts hissi): gradient fill + sade eksen + grid.
export const AreaChartPanel = ({
  data,
  xKey,
  yKey,
  color = "#3b82f6",
  height = 260,
  valueFormatter,
}: AreaChartPanelProps) => {
  const id = `area-${yKey}`
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tick={{ fontSize: 11, fill: AXIS }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 11, fill: AXIS }}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={<ThemedTooltip valueFormatter={valueFormatter} />}
            cursor={{ stroke: color, strokeOpacity: 0.25 }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
