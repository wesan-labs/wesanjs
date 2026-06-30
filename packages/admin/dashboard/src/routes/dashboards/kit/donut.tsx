import { ReactNode } from "react"
import { Cell, Pie, PieChart } from "recharts"

export type DonutSegment = { label: string; value: number; color: string }

type DonutProps = {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  center?: ReactNode
}

// Kompozisyon donut'u — "X'in Y'ye payı" (ör. abonelik vs reklam). Sıfır/negatif
// segment elenir; hiç veri yoksa nötr boş halka çizilir. Merkez içerik overlay.
export const Donut = ({
  segments,
  size = 132,
  thickness = 16,
  center,
}: DonutProps) => {
  const data = segments.filter((s) => s.value > 0)
  const outer = size / 2
  const inner = outer - thickness

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={
            data.length ? data : [{ label: "—", value: 1, color: "#f4f4f5" }]
          }
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={inner}
          outerRadius={outer}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          {(data.length ? data : [{ color: "#f4f4f5" }]).map((s, i) => (
            <Cell key={i} fill={s.color} />
          ))}
        </Pie>
      </PieChart>
      {center ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      ) : null}
    </div>
  )
}
