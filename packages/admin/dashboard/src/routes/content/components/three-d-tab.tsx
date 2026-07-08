import { ArrowDownTray, CubeSolid, Spinner } from "@medusajs/icons"
import { Badge, Button, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
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
  onVersion,
  onDone,
}: {
  source?: Version
  /** hero çıktısını tuvale yeni versiyon olarak ekle */
  onVersion: (dataUrl: string, label: string) => void
  /** zincir bitti — parent stepper durumu için */
  onDone?: () => void
}) => {
  const [assetId, setAssetId] = useState<string | null>(null)
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
    if (!source) return
    create.mutate(
      { images: [source.url] },
      {
        onSuccess: (res) => setAssetId(res.asset.id),
        onError: (e) =>
          toast.error("Zincir başlatılamadı", { description: String(e?.message ?? e) }),
      }
    )
  }

  /** Hero çıktısını (uzak URL, 10 dk expire) indir → data URL → tuvale versiyon. */
  const heroToCanvas = async (url: string) => {
    try {
      const blob = await (await fetch(url)).blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = reject
        r.readAsDataURL(blob)
      })
      onVersion(dataUrl, "360° Hero")
      toast.success("Hero tuvale versiyon olarak eklendi")
    } catch {
      toast.error("Hero indirilemedi (CORS/expire) — re-host dilimi bunu çözecek")
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <CubeSolid className="text-ui-fg-interactive" />
        <Text weight="plus">3D / 360° Turntable</Text>
      </div>

      {/* Kaynak = tuvaldeki seçili versiyon */}
      {source ? (
        <div className="border-ui-border-base flex items-center gap-x-3 rounded-lg border p-2.5">
          <img src={source.url} alt={source.label} className="size-12 rounded-md object-cover" />
          <div className="min-w-0">
            <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wide">
              Kaynak
            </Text>
            <Text size="small" className="truncate">
              {source.label} (tuvaldeki görsel)
            </Text>
          </div>
        </div>
      ) : (
        <Text size="small" className="text-ui-fg-muted">
          Önce tuvale bir ürün görseli yükle — zincir onu kaynak alır.
        </Text>
      )}

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

      <Button onClick={run} isLoading={running} disabled={!source || running} className="w-fit">
        Zinciri Çalıştır
      </Button>

      {/* Çıktılar */}
      {asset?.hero_url && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            ① Hero
          </Text>
          <img
            src={asset.hero_url}
            alt="hero"
            className="border-ui-border-base w-full rounded-lg border"
          />
          <Button
            variant="secondary"
            size="small"
            className="w-fit"
            onClick={() => heroToCanvas(asset.hero_url!)}
          >
            <ArrowDownTray />
            Tuvale versiyon olarak ekle
          </Button>
        </div>
      )}
      {asset?.video_url && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            ②③ 360° Orbital (4K)
          </Text>
          <video
            src={asset.video_url}
            controls
            loop
            autoPlay
            muted
            className="border-ui-border-base w-full rounded-lg border"
          />
        </div>
      )}
    </div>
  )
}
