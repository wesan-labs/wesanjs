import { Area, AreaChart, ResponsiveContainer } from "recharts"

type SparklineProps = {
  data: number[]
  color?: string
  height?: number
}

// Kart içi minik trend — eksen/grid yok. Sadece gerçek (>1 nokta) seride çağrılır.
export const Sparkline = ({
  data,
  color = "#6b7280",
  height = 28,
}: SparklineProps) => {
  if (!data || data.length < 2) {
    return null
  }
  const points = data.map((value, i) => ({ i, value }))
  const id = `spark-${color.replace("#", "")}`

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
