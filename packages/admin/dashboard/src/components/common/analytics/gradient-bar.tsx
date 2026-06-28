import { clx } from "@medusajs/ui"

export interface GradientBarProps {
  /** 0–100; clamped */
  pct: number
  from?: string
  to?: string
  height?: number
  className?: string
}

/**
 * A horizontal gradient progress bar (e.g. value-vs-target). Generic primitive
 * used for benchmark / health / composition fills across analytics views.
 */
export const GradientBar = ({
  pct,
  from = "#8B5CF6",
  to = "#F59E0B",
  height = 10,
  className,
}: GradientBarProps) => (
  <div
    className={clx(
      "bg-ui-bg-subtle relative w-full overflow-hidden rounded-full",
      className
    )}
    style={{ height }}
  >
    <div
      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
      style={{
        width: `${Math.max(2, Math.min(100, pct))}%`,
        background: `linear-gradient(90deg, ${from}, ${to})`,
      }}
    />
  </div>
)
