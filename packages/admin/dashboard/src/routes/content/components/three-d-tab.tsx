import { ArrowDownTray, CubeSolid, Spinner } from "@medusajs/icons"
import { Badge, Button, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { MIN_PHOTOS, PhotoSet } from "./photo-set"
import {
  use3DAsset,
  use3DPipeline,
  useCreate3DAsset,
  type PipelineStepInfo,
  type Product3DAsset,
} from "../../../hooks/api/content"
import type { Version } from "../index"

type CardState = "idle" | "waiting" | "running" | "done" | "failed"

/** Kart durumu — asset'in pipeline_step'ine göre (descriptor sırası). Saf. */
const cardState = (
  op: string,
  order: string[],
  asset: Product3DAsset | undefined
): CardState => {
  if (!asset) return "idle"
  if (asset.pipeline_step === "done" || asset.status === "ready") return "done"
  const active = order.indexOf(asset.pipeline_step ?? "")
  const i = order.indexOf(op)
  if (asset.status === "failed") {
    return i === active ? "failed" : i < active ? "done" : "waiting"
  }
  return i < active ? "done" : i === active ? "running" : "waiting"
}

const STATE_BADGE: Record<CardState, { color: "grey" | "blue" | "green" | "red"; label: string }> = {
  idle: { color: "grey", label: "hazır değil" },
  waiting: { color: "grey", label: "bekliyor" },
  running: { color: "blue", label: "işleniyor" },
  done: { color: "green", label: "tamam" },
  failed: { color: "red", label: "başarısız" },
}

/** Tek operasyon kartı: op-spec (salt-okunur) · provider · params · durum (§5b). */
const OperationCard = ({
  step,
  state,
}: {
  step: PipelineStepInfo
  state: CardState
}) => (
  <div className="border-ui-border-base flex flex-col gap-y-2 rounded-lg border p-3">
    <div className="flex items-center justify-between">
      <Text size="small" weight="plus">
        {step.label}
      </Text>
      <div className="flex items-center gap-x-1.5">
        {state === "running" && <Spinner className="text-ui-fg-interactive animate-spin" />}
        <Badge size="2xsmall" color={STATE_BADGE[state].color}>
          {STATE_BADGE[state].label}
        </Badge>
      </div>
    </div>
    {/* op-spec: sabit işlem tanımı — düğme DEĞİL, salt-okunur (§5b) */}
    {step.op_spec && (
      <Text size="xsmall" className="text-ui-fg-muted italic">
        {step.op_spec}
      </Text>
    )}
    <div className="flex flex-wrap items-center gap-1">
      <Badge size="2xsmall" color="purple">
        {step.provider}
      </Badge>
      {Object.entries(step.params).map(([k, v]) => (
        <Badge key={k} size="2xsmall" color="grey">
          {k.replace(/_/g, " ")}: {String(v)}
        </Badge>
      ))}
      {!step.key_configured && (
        <Badge size="2xsmall" color="orange">
          {step.env_key} eksik
        </Badge>
      )}
    </div>
  </div>
)

/**
 * 3D / 360° paneli — zincir stüdyonun İÇİNDE (§5b F1/F2): girdi = tuvaldeki
 * seçili versiyon (ayrı upload YOK), operasyon kartları pipeline TANIMINDAN
 * render, çıktılar tuvale/panele döner (hero → versiyon, video → oynatıcı).
 */
export const ThreeDTab = ({
  source,
  onDone,
}: {
  source?: Version
  onDone?: () => void
}) => {
  const [assetId, setAssetId] = useState<string | null>(null)
  const [productRef, setProductRef] = useState("")
  const [photos, setPhotos] = useState<string[]>([]) // ürünün çoklu-açı foto'ları (data-URL)
  const create = useCreate3DAsset()
  const { data: pipelineData } = use3DPipeline()
  const { data: assetData } = use3DAsset(assetId ?? undefined)

  const steps = pipelineData?.steps ?? []
  const order = steps.map((s) => s.op)
  const asset = assetData?.asset
  const running = create.isPending || asset?.status === "processing"

  useEffect(() => {
    if (asset?.status === "ready") onDone?.()
  }, [asset?.status, onDone])

  const run = () => {
    if (photos.length < MIN_PHOTOS) return
    create.mutate(
      { images: photos, product_ref: productRef.trim() || undefined },
      {
        onSuccess: (res) => setAssetId(res.asset.id),
        onError: (e) =>
          toast.error("3D üretimi başlatılamadı", { description: String(e?.message ?? e) }),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <CubeSolid className="text-ui-fg-interactive" />
        <Text weight="plus">3D Model (GLB)</Text>
      </div>

      {/* Çekim rehberi — kapsama = kalite (kanıt: 141° boşluk çöp verir) */}
      <div className="border-ui-border-base bg-ui-bg-subtle rounded-lg border p-3">
        <Text size="xsmall" weight="plus" className="text-ui-fg-base">
          Ürünün etrafında dön, farklı açılardan çek
        </Text>
        <ul className="text-ui-fg-subtle mt-1 list-disc pl-4 text-xs leading-5">
          <li>6–8+ açı — ön, yan, arka, üst. Tüm yüzeyler görünsün.</li>
          <li>Sabit mesafe, aynı ışık, düz/sade zemin.</li>
          <li>Eksik açı = o taraf 3D'de bozuk çıkar.</li>
        </ul>
      </div>

      {/* Çoklu-açı foto seti (reusable PhotoSet — kapsama dahil) */}
      <PhotoSet photos={photos} onChange={setPhotos} showCoverage disabled={running} />
      {source && !photos.includes(source.url) && (
        <Button
          variant="transparent"
          size="small"
          className="w-fit"
          onClick={() => setPhotos((prev) => [...prev, source.url])}
        >
          + Tuvaldeki görseli de ekle
        </Button>
      )}

      {/* Ürün adı/kodu — kütüphane klasörleme anahtarı (çıktılar bununla kaydolur) */}
      <Input
        placeholder="Ürün adı / kodu (kütüphane gruplama — örn. KLT-102 Koltuk)"
        value={productRef}
        onChange={(e) => setProductRef(e.target.value)}
        disabled={running}
      />

      {/* Operasyon kartları — pipeline tanımından (§5b: UI descriptor'dan render) */}
      <div className="flex flex-col gap-y-2">
        {steps.map((s) => (
          <OperationCard key={s.op} step={s} state={cardState(s.op, order, asset)} />
        ))}
      </div>

      {asset?.status === "failed" && (
        <Text size="small" className="text-ui-fg-error">
          {asset.error}
        </Text>
      )}

      <Button
        onClick={run}
        isLoading={running}
        disabled={photos.length < MIN_PHOTOS || running}
        className="w-fit"
      >
        {running ? "3D üretiliyor…" : "3D Model Oluştur"}
      </Button>

      {/* Çıktı — 360° video (Veo). */}
      {asset?.video_url && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            360° Ürün Videosu
          </Text>
          <video
            key={asset.video_url}
            src={asset.video_url}
            controls
            loop
            autoPlay
            muted
            className="border-ui-border-base w-full rounded-lg border"
          />
        </div>
      )}

      {/* Çıktı — GLB (opsiyonel; viewer three peer-dep istiyor, ileride ayrı yüklenecek). */}
      {asset?.mesh_url && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            3D Model (GLB) hazır
          </Text>
          <a href={asset.mesh_url} download="model.glb">
            <Button variant="secondary" size="small" className="w-fit">
              <ArrowDownTray />
              GLB indir
            </Button>
          </a>
        </div>
      )}
    </div>
  )
}
