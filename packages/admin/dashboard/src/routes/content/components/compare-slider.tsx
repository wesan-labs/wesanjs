import { Text } from "@medusajs/ui"
import { useRef, useState } from "react"

/**
 * Transparency backing for the `after` (edited) side. Without it, a background-
 * removed PNG's transparent pixels reveal the opaque `before` image underneath
 * — making "arka planı temizledim ama eski resim duruyor". The checkerboard sits
 * between the two images so transparency reads as transparent, not as original.
 */
const CHECKERBOARD: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,rgba(130,130,130,0.13) 25%,transparent 25%),linear-gradient(-45deg,rgba(130,130,130,0.13) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(130,130,130,0.13) 75%),linear-gradient(-45deg,transparent 75%,rgba(130,130,130,0.13) 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0,0 9px,9px -9px,-9px 0",
}

/**
 * Draggable before/after compare — the signature image-editor interaction.
 * `before` (original) fills the box; `after` (edited) is clipped to the right of
 * a draggable divider and backed by a checkerboard so transparent edits read
 * correctly. Left of the divider = Orijinal, right = Şu an. Pointer-based so it
 * works on touch + mouse.
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
      {/* Düzenlenmiş taraf: checkerboard + after, ikisi de bölücünün sağına
          kırpılır. after şeffafsa altındaki orijinali DEĞİL checkerboard'u
          gösterir → arka plan gerçekten temiz görünür. */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${pos}%)`, ...CHECKERBOARD }}
      >
        <img
          src={after}
          alt="Düzenlenmiş"
          draggable={false}
          className="absolute inset-0 size-full object-contain"
        />
      </div>

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
