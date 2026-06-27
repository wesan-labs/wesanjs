import { Text } from "@medusajs/ui"
import { useRef, useState } from "react"

/**
 * Draggable before/after compare — the signature image-editor interaction.
 * `before` sets the box size; `after` overlays it, clipped from the right by a
 * handle the user drags. Pointer-based so it works on touch + mouse.
 */
export const CompareSlider = ({
  before,
  after,
}: {
  before: string
  after: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)

  const move = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    setPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }

  return (
    <div
      ref={ref}
      className="relative max-h-[60vh] w-full touch-none select-none overflow-hidden rounded-lg"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) {
          move(e.clientX)
        }
      }}
    >
      <img
        src={before}
        alt="Orijinal"
        draggable={false}
        className="block max-h-[60vh] w-full object-contain"
      />
      <img
        src={after}
        alt="Düzenlenmiş"
        draggable={false}
        className="absolute inset-0 size-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Etiketler */}
      <span className="bg-ui-bg-base/80 text-ui-fg-subtle absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
        Orijinal
      </span>
      <span className="bg-ui-bg-base/80 text-ui-fg-subtle absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
        Şu an
      </span>

      {/* Sürükleme çubuğu */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-white shadow-md">
          <Text size="xsmall" className="text-ui-fg-muted leading-none">
            ↔
          </Text>
        </div>
      </div>
    </div>
  )
}
