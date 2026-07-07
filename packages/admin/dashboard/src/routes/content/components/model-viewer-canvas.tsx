import "@google/model-viewer"
import { useRef, useState } from "react"
import { Button } from "@medusajs/ui"

type ModelViewerEl = HTMLElement & {
  toBlob: (options?: {
    mimeType?: string
    qualityArgument?: number
    idealAspect?: boolean
  }) => Promise<Blob>
  cameraOrbit?: string
}

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
  height?: number
}

/**
 * GLB'yi <model-viewer> ile döndürülebilir render eder; "ekran görüntüsü"
 * butonu o anki açıyı PNG olarak yakalar (toBlob). Master varlık GLB; hero
 * görsel = kullanıcının yakaladığı kare (mimari v2 §4).
 */
export const ModelViewerCanvas = ({ meshUrl, onCapture, height = 420 }: ModelViewerCanvasProps) => {
  const ref = useRef<ModelViewerEl>(null)
  const [busy, setBusy] = useState(false)

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
      <Button size="small" onClick={capture} isLoading={busy}>
        Ekran görüntüsü al
      </Button>
    </div>
  )
}
