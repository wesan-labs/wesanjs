import { ArrowDownTray, CubeSolid, Spinner, Trash, XMarkMini } from "@medusajs/icons"
import { Badge, Button, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { FileType, FileUpload } from "../../../components/common/file-upload/file-upload"
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
/** Kapsama eşiği — reconstruction için (141° boşluk çöp verdi; kanıt-temelli). */
const MIN_PHOTOS = 4
const GOOD_PHOTOS = 6

/** Foto sayısına göre 3D-hazırlık: kaç açı var, yeterli mi. Saf. */
const coverage = (n: number): { pct: number; color: "red" | "orange" | "green"; label: string } => {
  if (n === 0) return { pct: 0, color: "red", label: "En az 4 açı gerekli" }
  if (n < MIN_PHOTOS) return { pct: (n / GOOD_PHOTOS) * 100, color: "red", label: `${n} açı — çok az, daha fazla ekle` }
  if (n < GOOD_PHOTOS) return { pct: (n / GOOD_PHOTOS) * 100, color: "orange", label: `${n} açı — olur, ama 6+ daha iyi` }
  return { pct: 100, color: "green", label: `${n} açı — 3D'ye hazır ✓` }
}

const BAR: Record<"red" | "orange" | "green", string> = {
  red: "bg-ui-tag-red-icon",
  orange: "bg-ui-tag-orange-icon",
  green: "bg-ui-tag-green-icon",
}

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
  const cov = coverage(photos.length)

  useEffect(() => {
    if (asset?.status === "ready") onDone?.()
  }, [asset?.status, onDone])

  // Dosya → downscale'li data-URL (canvas; başarısızsa ham FileReader'a düş). Bulletproof.
  const fileToDataUrl = (file: File, maxDim = 2000): Promise<string> =>
    new Promise((resolve) => {
      const raw = () => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => resolve("")
        r.readAsDataURL(file)
      }
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height || 1))
          const c = document.createElement("canvas")
          c.width = Math.max(1, Math.round(img.width * scale))
          c.height = Math.max(1, Math.round(img.height * scale))
          const ctx = c.getContext("2d")
          URL.revokeObjectURL(url)
          if (!ctx) return raw()
          ctx.drawImage(img, 0, 0, c.width, c.height)
          resolve(c.toDataURL("image/jpeg", 0.85))
        } catch {
          raw()
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        raw()
      }
      img.src = url
    })

  const addFiles = async (files: FileType[]) => {
    if (!files?.length) {
      return
    }
    try {
      const added = (await Promise.all(files.map((f) => fileToDataUrl(f.file)))).filter(Boolean)
      if (!added.length) {
        toast.error("Foto okunamadı")
        return
      }
      setPhotos((prev) => [...prev, ...added])
      toast.success(`${added.length} foto eklendi`)
    } catch (e) {
      toast.error("Foto eklenemedi", { description: String((e as Error)?.message ?? e) })
    }
  }

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

      {/* Çoklu-açı yükleyici */}
      <FileUpload
        label="Ürün fotoğraflarını sürükle ya da seç"
        hint="JPEG, PNG, WebP · birden fazla"
        multiple
        formats={["image/jpeg", "image/png", "image/webp"]}
        maxFileSize={Infinity}
        onUploaded={addFiles}
      />
      {source && !photos.some((p) => p === source.url) && (
        <Button
          variant="transparent"
          size="small"
          className="w-fit"
          onClick={() => setPhotos((prev) => [...prev, source.url])}
        >
          + Tuvaldeki görseli de ekle
        </Button>
      )}

      {/* Yüklenen açılar + kaldır */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative">
              <img src={p} alt={`açı ${i + 1}`} className="border-ui-border-base size-16 rounded-md border object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="bg-ui-bg-base border-ui-border-base absolute -right-1.5 -top-1.5 rounded-full border p-0.5 shadow-sm"
              >
                <XMarkMini />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPhotos([])}
            className="text-ui-fg-muted hover:text-ui-fg-base flex size-16 flex-col items-center justify-center gap-y-0.5 rounded-md border border-dashed"
          >
            <Trash />
            <span className="text-[10px]">Temizle</span>
          </button>
        </div>
      )}

      {/* Kapsama göstergesi */}
      <div className="flex flex-col gap-y-1">
        <div className="bg-ui-bg-base h-1.5 w-full overflow-hidden rounded-full">
          <div className={`h-full rounded-full transition-all ${BAR[cov.color]}`} style={{ width: `${cov.pct}%` }} />
        </div>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {cov.label}
        </Text>
      </div>

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
