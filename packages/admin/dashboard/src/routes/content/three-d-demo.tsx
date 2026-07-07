import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useCreate3DAsset, use3DAsset } from "../../hooks/api/content"

// Pipeline adımları (Flux2 → Seedance → SeeDVR). "sample" (④ kare) v1'de ertelendi.
const STEPS = [
  { key: "hero", label: "① Hero · Flux2" },
  { key: "orbital", label: "② 360° · Seedance" },
  { key: "upscale", label: "③ 4K · SeedVR" },
  { key: "done", label: "✓ Hazır" },
]

const stepIndex = (s: string | null) => {
  const i = STEPS.findIndex((x) => x.key === s)
  return i === -1 ? 0 : i
}

export const Component = () => {
  const [imageUrl, setImageUrl] = useState("")
  const [assetId, setAssetId] = useState<string | null>(null)

  const create = useCreate3DAsset()
  const { data } = use3DAsset(assetId ?? undefined)
  const asset = data?.asset

  const generate = () => {
    // Virgülle çoklu görsel: ilki hero kaynağı, kalanı kimlik referansı.
    const images = imageUrl
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!images.length) return
    create.mutate(
      { images },
      {
        onSuccess: (res) => setAssetId(res.asset.id),
        onError: (e) => toast.error("Üretim başlatılamadı", { description: String(e?.message ?? e) }),
      }
    )
  }

  const active = stepIndex(asset?.pipeline_step ?? null)
  const failed = asset?.status === "failed"

  return (
    <Container className="p-6">
      <div className="mb-4 flex flex-col gap-y-1">
        <Heading level="h2">3D Ürün Stüdyosu · pipeline</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Public ürün görseli URL'i → Flux2 hero → Seedance 360° orbital → SeedVR 4K. Çoklu görsel
          için virgülle ayır (ilki hero, kalanı kimlik referansı).
        </Text>
      </div>

      <div className="mb-5 flex max-w-2xl flex-col gap-y-2">
        <Input
          placeholder="https://… ürün görseli (public, redirect'siz)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <div>
          <Button size="small" onClick={generate} isLoading={create.isPending} disabled={!imageUrl.trim()}>
            Üret
          </Button>
        </div>
      </div>

      {asset && (
        <div className="flex max-w-3xl flex-col gap-y-4">
          {/* Pipeline stepper */}
          <div className="flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < active || asset.status === "ready"
              const isActive = i === active && asset.status === "processing"
              return (
                <Badge
                  key={s.key}
                  size="small"
                  color={failed && i === active ? "red" : done ? "green" : isActive ? "blue" : "grey"}
                >
                  {isActive ? "⏳ " : ""}
                  {s.label}
                </Badge>
              )
            })}
          </div>

          {/* Durum / hata */}
          {asset.status === "processing" && (
            <Text size="small" className="text-ui-fg-subtle">
              İşleniyor… ({asset.pipeline_step}) — 3 sn'de bir güncelleniyor.
            </Text>
          )}
          {failed && (
            <Text size="small" className="text-ui-fg-error">
              Başarısız: {asset.error}
            </Text>
          )}

          {/* ① Hero görseli */}
          {asset.hero_url && (
            <div className="flex flex-col gap-y-1">
              <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                ① Hero (Flux2)
              </Text>
              <img
                src={asset.hero_url}
                alt="hero"
                className="max-w-md rounded-lg border border-ui-border-base"
              />
            </div>
          )}

          {/* ②③ Orbital video (4K) */}
          {asset.video_url && (
            <div className="flex flex-col gap-y-1">
              <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                ②③ 360° Orbital (SeedVR 4K)
              </Text>
              <video
                src={asset.video_url}
                controls
                loop
                autoPlay
                muted
                className="max-w-md rounded-lg border border-ui-border-base"
              />
            </div>
          )}
        </div>
      )}
    </Container>
  )
}
