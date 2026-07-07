import "@google/model-viewer"
import { useRef, useState } from "react"
import { Button, Text } from "@medusajs/ui"

type ModelViewerEl = HTMLElement & {
  toBlob: (options?: {
    mimeType?: string
    qualityArgument?: number
    idealAspect?: boolean
  }) => Promise<Blob>
  cameraOrbit?: string
  updateComplete: Promise<boolean>
}

// 72 kare @ 5° (turntable.ts'in frontend aynası) — tam 360° tur.
const TURNTABLE_ANGLES = Array.from({ length: 72 }, (_, i) => i * 5)

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })

export interface ModelViewerCanvasProps {
  meshUrl: string
  /** kullanıcı bir açıyı yakaladığında (PNG data URL) */
  onCapture?: (dataUrl: string) => void
  /** 72-kare turntable üretilince (PNG data URL dizisi) */
  onTurntable?: (frames: string[]) => void
  height?: number
}

/**
 * GLB'yi <model-viewer> ile döndürülebilir render eder; "ekran görüntüsü"
 * butonu o anki açıyı PNG olarak yakalar (toBlob). Master varlık GLB; hero
 * görsel = kullanıcının yakaladığı kare (mimari v2 §4).
 */
export const ModelViewerCanvas = ({
  meshUrl,
  onCapture,
  onTurntable,
  height = 420,
}: ModelViewerCanvasProps) => {
  const ref = useRef<ModelViewerEl>(null)
  const [busy, setBusy] = useState(false)
  const [ttBusy, setTtBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const capture = async () => {
    const mv = ref.current
    if (!mv) return
    setBusy(true)
    try {
      const blob = await mv.toBlob({ mimeType: "image/png", idealAspect: true })
      onCapture?.(await blobToDataUrl(blob))
    } finally {
      setBusy(false)
    }
  }

  // Her açıya kamerayı çevir → kareyi yakala. GLB'den bedava, deterministik sıra.
  const runTurntable = async () => {
    const mv = ref.current
    if (!mv) return
    setTtBusy(true)
    setProgress(0)
    const frames: string[] = []
    try {
      mv.removeAttribute("auto-rotate") // manuel açı seti için otomatik dönüşü durdur
      for (const deg of TURNTABLE_ANGLES) {
        mv.cameraOrbit = `${deg}deg 75deg auto`
        await mv.updateComplete
        await nextFrame()
        const blob = await mv.toBlob({ mimeType: "image/png", idealAspect: true })
        frames.push(await blobToDataUrl(blob))
        setProgress(frames.length)
      }
      onTurntable?.(frames)
    } finally {
      mv.setAttribute("auto-rotate", "")
      setTtBusy(false)
      setProgress(0)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle">
        <model-viewer
          ref={ref}
          src={meshUrl}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ width: "100%", height: `${height}px` }}
        />
      </div>
      <div className="flex items-center gap-x-2">
        <Button size="small" onClick={capture} isLoading={busy} disabled={ttBusy}>
          Ekran görüntüsü al
        </Button>
        <Button size="small" variant="secondary" onClick={runTurntable} isLoading={ttBusy} disabled={busy}>
          Turntable (72 kare)
        </Button>
        {ttBusy && (
          <Text size="small" className="text-ui-fg-subtle">
            {progress}/72
          </Text>
        )}
      </div>
    </div>
  )
}
