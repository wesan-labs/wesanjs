import { Text } from "@medusajs/ui"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

export interface DonutDatum {
  name: string
  value: number
}

export interface DonutChartProps {
  data: DonutDatum[]
  /** total of all values (for share %) */
  total: number
  /** pre-formatted center number, e.g. "598" or "1.2K" */
  centerValue: string
  centerLabel?: string
  palette?: string[]
  size?: number
}

const DEFAULT_PALETTE = ["#8B5CF6", "#F59E0B", "#3B82F6", "#10B981", "#EC4899", "#14B8A6"]

/**
 * Donut with a center total + legend (name · share%). Generic: caller supplies
 * the slices and the formatted center value.
 */
export const DonutChart = ({
  data,
  total,
  centerValue,
  centerLabel,
  palette = DEFAULT_PALETTE,
  size = 128,
}: DonutChartProps) => {
  if (!data.length) {
    return (
      <div className="text-ui-fg-muted flex h-[160px] items-center justify-center">
        <Text size="small">Veri yok.</Text>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-x-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={size * 0.31}
              outerRadius={size * 0.47}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <Text size="small" weight="plus" className="tabular-nums leading-none">
            {centerValue}
          </Text>
          {centerLabel && (
            <Text size="xsmall" className="text-ui-fg-muted leading-none">
              {centerLabel}
            </Text>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-x-1.5 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: palette[i % palette.length] }}
            />
            <span className="text-ui-fg-subtle truncate">{d.name}</span>
            <span className="text-ui-fg-muted ml-auto tabular-nums">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
