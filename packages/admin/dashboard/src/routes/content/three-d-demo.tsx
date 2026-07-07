import { Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { ModelViewerCanvas } from "./components/model-viewer-canvas"
import { useCreate3DAsset, use3DAsset } from "../../hooks/api/content"

// model-viewer'ın herkese açık örnek GLB'si — viewer/capture/turntable'ı
// backend/kredi olmadan test etmek için (Faz A görsel doğrulama).
const SAMPLE_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb"

export const Component = () => {
  const [imageUrl, setImageUrl] = useState("")
  const [assetId, setAssetId] = useState<string | null>(null)
  const [sampleMesh, setSampleMesh] = useState<string | null>(null)
  const [frames, setFrames] = useState<string[]>([])

  const create = useCreate3DAsset()
  const { data } = use3DAsset(assetId ?? undefined)
  const asset = data?.asset

  const meshUrl = sampleMesh ?? (asset?.status === "ready" ? asset.mesh_url : null)

  const generate = () => {
    if (!imageUrl.trim()) return
    setSampleMesh(null)
    setFrames([])
    create.mutate(
      { images: [imageUrl.trim()] },
      {
        onSuccess: (res) => setAssetId(res.asset.id),
        onError: (e) =>
          toast.error("Üretim başlatılamadı", { description: String(e?.message ?? e) }),
      }
    )
  }

  const downloadPng = (dataUrl: string, name: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = name
    a.click()
  }

  return (
    <Container className="p-6">
      <div className="mb-4 flex flex-col gap-y-1">
        <Heading level="h2">3D ürün stüdyosu (Faz A)</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Public ürün görseli URL'i → GLB üret (Tripo) → döndür → açı yakala / turntable. Ya da
          örnek GLB ile viewer'ı hemen dene.
        </Text>
      </div>

      <div className="mb-4 flex max-w-xl flex-col gap-y-2">
        <Input
          placeholder="https://… ürün görseli URL'i (public)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <div className="flex gap-x-2">
          <Button size="small" onClick={generate} isLoading={create.isPending} disabled={!imageUrl.trim()}>
            3D üret
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              setAssetId(null)
              setFrames([])
              setSampleMesh(SAMPLE_GLB)
            }}
          >
            Örnek GLB ile dene
          </Button>
        </div>
      </div>

      {assetId && asset?.status === "processing" && !sampleMesh && (
        <Text size="small" className="text-ui-fg-subtle">3D üretiliyor… (Tripo, ~10-100 sn)</Text>
      )}
      {asset?.status === "failed" && !sampleMesh && (
        <Text size="small" className="text-ui-fg-error">Üretim başarısız: {asset.error}</Text>
      )}

      {meshUrl && (
        <div className="flex max-w-2xl flex-col gap-y-3">
          <ModelViewerCanvas
            meshUrl={meshUrl}
            onCapture={(d) => {
              downloadPng(d, "aci.png")
              toast.success("Açı yakalandı (aci.png indirildi)")
            }}
            onTurntable={(f) => {
              setFrames(f)
              toast.success(`${f.length} kare üretildi`)
            }}
          />
          {frames.length > 0 && (
            <div className="flex gap-x-1 overflow-x-auto rounded-lg border border-ui-border-base p-2">
              {frames.map((f, i) => (
                <img key={i} src={f} alt={`kare ${i}`} className="h-16 w-16 flex-none rounded object-cover" />
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  )
}
