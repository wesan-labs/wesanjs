import {
  ArrowDownTray,
  Buildings,
  CheckMini,
  ChevronRightMini,
  CubeSolid,
  DocumentText,
  GlobeEurope,
  Language,
  MagnifyingGlass,
  PaperPlane,
  PencilSquare,
  Photo,
  Plus,
  Spinner,
  Sparkles,
  SquaresPlus,
  XMarkMini,
} from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Select,
  Switch,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import type { ProgressStatus } from "@medusajs/ui"
import { Fragment, useEffect, useState } from "react"
import {
  FileType,
  FileUpload,
} from "../../components/common/file-upload/file-upload"
import {
  AnalyzeResult,
  ContentVariant,
  dataUrlToImage,
  downscaleImage,
  EditImageInput,
  useAnalyzeImage,
  useCreateContentProduct,
  useEditImage,
  useSaveContentItem,
} from "../../hooks/api/content"
import {
  BrandProfile,
  loadBrandProfile,
  saveBrandProfile,
} from "./components/brand-profile"
import { BrandProfileDrawer } from "./components/brand-profile-drawer"
import { LibraryDrawer } from "./components/library-drawer"
import { BriefCard } from "./components/brief-card"
import { CompareSlider } from "./components/compare-slider"
import { CopyButton } from "./components/copy-button"
import { ImageEditor } from "./components/image-editor"
import { ImageMethod, ImageTab } from "./components/image-tab"
import { DEFAULT_LANGUAGE, LANGUAGES } from "./components/languages"
import { PackPicker } from "./components/pack-picker"
import { ThreeDTab } from "./components/three-d-tab"
import { PromptLibrarySection } from "./components/prompt-library-section"
import { TextMethod, TextTab } from "./components/text-tab"
import { VariantCard } from "./components/variant-card"
import { PublishComposer } from "../social-media/components/publish-composer"


const SECTOR_LABELS: Record<string, string> = {
  "mobile-game": "Mobil Oyun",
  "mobile-app": "Mobil Uygulama",
  "saas-web": "SaaS Web",
  furniture: "Mobilya",
}

/**
 * Theme-adaptive checkerboard so transparent edits read on a real editor canvas.
 * Low-alpha grey over the surface token → subtle in both light and dark mode
 * (no hard-coded white). Pair with a `bg-ui-bg-subtle` base.
 */
const CHECKERBOARD: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,rgba(130,130,130,0.13) 25%,transparent 25%),linear-gradient(-45deg,rgba(130,130,130,0.13) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(130,130,130,0.13) 75%),linear-gradient(-45deg,transparent 75%,rgba(130,130,130,0.13) 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0,0 9px,9px -9px,-9px 0",
}

/** One image in the non-destructive version stack. */
export interface Version {
  url: string
  data: string
  mime: string
  label: string
  prompt?: string
}

/** A generated text result (caption / script / prompt output). */
export interface TextResult {
  title: string
  text: string
  language?: string
}

/** A full media→content generation (brief + platform variants). */
export interface BriefResult {
  language: string
  brief: import("../../hooks/api/content").ContentBrief
  variants: ContentVariant[]
}

const IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"]
type Panel = "image" | "text" | "3d" | "publish"

/**
 * Unified content studio. ALL working data (image versions + generated texts)
 * lives here at the parent so switching the action panel never wipes it. The
 * right-side panels are controlled and stay mounted (hidden when inactive),
 * so even their inputs persist.
 */
export const Component = () => {
  const [versions, setVersions] = useState<Version[]>([])
  const [current, setCurrent] = useState(0)
  const [panel, setPanel] = useState<Panel>("image")
  const [languages, setLanguages] = useState<string[]>([DEFAULT_LANGUAGE])
  const [briefs, setBriefs] = useState<BriefResult[]>([])
  const [texts, setTexts] = useState<TextResult[]>([])
  // Which right-rail method is active per tab — "library" routes the prompt
  // gallery to the full-width dock at the bottom of the studio.
  const [imageMethod, setImageMethod] = useState<ImageMethod>("free")
  const [textMethod, setTextMethod] = useState<TextMethod>("quick")
  // Vision analysis: auto-detect sector + brand on upload (toggle persists).
  const [autoAnalyze, setAutoAnalyze] = useState(
    () => localStorage.getItem("content-auto-analyze") !== "off"
  )
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [pubTextIdx, setPubTextIdx] = useState(0)
  // 3D zinciri tamamlandı mı — stepper durumu (asıl state ThreeDTab'da).
  const [threeDDone, setThreeDDone] = useState(false)
  const analyzeMut = useAnalyzeImage()

  const toggleAutoAnalyze = (on: boolean) => {
    setAutoAnalyze(on)
    localStorage.setItem("content-auto-analyze", on ? "on" : "off")
  }
  const runAnalyze = (img: { data: string; mime: string }) =>
    analyzeMut.mutate(img, {
      onSuccess: ({ analysis }) => setAnalysis(analysis),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Analiz edilemedi"),
    })

  const source = versions[current]
  const original = versions[0]

  const handleUpload = async (files: FileType[]) => {
    const f = files[0]
    if (!f) {
      return
    }
    const img = await downscaleImage(f.file, 1280)
    const url = `data:${img.mime};base64,${img.data}`
    setVersions([{ url, data: img.data, mime: img.mime, label: "Orijinal" }])
    setCurrent(0)
    setAnalysis(null)
    if (autoAnalyze) {
      runAnalyze({ data: img.data, mime: img.mime })
    }
  }

  const addVersion = (url: string, data: string, mime: string, prompt?: string) => {
    setVersions((prev) => {
      const next = [
        ...prev,
        { url, data, mime, label: `Düzenleme ${prev.length}`, prompt },
      ]
      setCurrent(next.length - 1)
      return next
    })
  }

  const addText = (result: TextResult) => setTexts((prev) => [result, ...prev])
  const addBrief = (result: BriefResult) => setBriefs((prev) => [result, ...prev])

  // Image editing lives in the parent so the canvas can show a loading overlay
  // and both the Düzenle and Prompt panels share one busy state.
  const editImageMut = useEditImage()
  const editing = editImageMut.isPending

  const runEdit = async (
    body: Omit<EditImageInput, "image">,
    label?: string
  ) => {
    if (!source) {
      toast.error("Önce bir görsel yükle")
      return
    }
    const { image } = await editImageMut.mutateAsync({
      image: { data: source.data, mime: source.mime },
      ...body,
    })
    const parsed = dataUrlToImage(image)
    addVersion(image, parsed.data, parsed.mime, label)
  }

  /** Add a version produced client-side (e.g. background removal). */
  const applyImageResult = (dataUrl: string, label: string) => {
    const parsed = dataUrlToImage(dataUrl)
    addVersion(dataUrl, parsed.data, parsed.mime, label)
  }

  // Saved library (persisted in the backend).
  const [libraryOpen, setLibraryOpen] = useState(false)
  const saveMut = useSaveContentItem()

  // Brand profile (filled once → auto-fills every prompt). localStorage-backed.
  const [brandOpen, setBrandOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({})
  useEffect(() => setBrandProfile(loadBrandProfile()), [])
  const updateBrandProfile = (p: BrandProfile) => {
    setBrandProfile(p)
    saveBrandProfile(p)
  }

  // İçerik üretiminin iş çıktısı: varlıkları Medusa ürününe çevir (§5c adım 3).
  const createProductMut = useCreateContentProduct()
  const handleCreateProduct = () => {
    if (!versions.length) {
      return
    }
    const title = analysis?.summary?.slice(0, 60)?.trim() || "Yeni ürün"
    createProductMut.mutate(
      { title, images: versions.map((v) => v.url) },
      {
        onSuccess: (r) =>
          toast.success("Ürün oluşturuldu (taslak)", {
            description: `${r.product?.title ?? title} — mağazada düzenleyebilirsin`,
          }),
        onError: (e) =>
          toast.error("Ürün oluşturulamadı", { description: String(e?.message ?? e) }),
      }
    )
  }

  const saveImage = () => {
    if (!source) {
      return
    }
    saveMut.mutate(
      { kind: "image", value: source.url, title: source.label },
      { onSuccess: () => toast.success("Görsel kütüphaneye kaydedildi") }
    )
  }

  const saveText = (title: string, value: string, language?: string) =>
    saveMut.mutate(
      { kind: "text", title, value, language },
      { onSuccess: () => toast.success("Metin kütüphaneye kaydedildi") }
    )

  const resetAll = () => {
    setVersions([])
    setCurrent(0)
    setBriefs([])
    setTexts([])
    setAnalysis(null)
  }

  const suggestedSector =
    analysis && analysis.sector !== "other" ? analysis.sector : undefined

  const statuses: Record<Panel, ProgressStatus> = {
    // Görsel yüklendiyse adım tamam — düzenleme opsiyonel (ürün niyeti §9).
    image: source ? "completed" : "not-started",
    text: briefs.length || texts.length ? "completed" : "not-started",
    "3d": threeDDone ? "completed" : "not-started",
    publish: "not-started",
  }

  return (
    <Container className="flex h-[calc(100dvh-80px)] flex-col divide-y overflow-hidden p-0">
      <Header
        panel={panel}
        setPanel={setPanel}
        statuses={statuses}
        languages={languages}
        setLanguages={setLanguages}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenBrand={() => setBrandOpen(true)}
        brandSet={!!brandProfile.BRAND_NAME?.trim()}
      />

      <LibraryDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onUseImage={applyImageResult}
      />
      <BrandProfileDrawer
        open={brandOpen}
        onOpenChange={setBrandOpen}
        profile={brandProfile}
        onSave={updateBrandProfile}
      />
      {editorOpen && source && (
        <ImageEditor
          source={source.url}
          onSave={(dataUrl) => {
            applyImageResult(dataUrl, "Düzenlendi")
            setEditorOpen(false)
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}

      <div
        className={clx(
          "grid min-h-0 flex-1 grid-cols-1",
          source
            ? "lg:grid-cols-[84px_minmax(0,1fr)_440px]"
            : "lg:grid-cols-[minmax(0,1fr)_460px]"
        )}
      >
        {/* Sol: versiyon şeridi */}
        {source && (
        <div className="flex flex-row gap-2 border-b p-3 lg:flex-col lg:border-b-0 lg:border-r">
          {versions.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              title={v.label}
              className={clx(
                "animate-in fade-in-0 zoom-in-95 relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border transition-all duration-150 ease-out active:scale-95 motion-reduce:animate-none lg:w-full",
                i === current
                  ? "border-ui-border-interactive shadow-borders-interactive-with-active"
                  : "border-ui-border-base opacity-70 hover:opacity-100"
              )}
            >
              <img src={v.url} alt={v.label} className="size-full object-cover" />
            </button>
          ))}
        </div>
        )}

        {/* Orta: canvas + sonuçlar (kalıcı) */}
        <div className="flex min-h-0 flex-col gap-y-4 overflow-y-auto border-b p-6 lg:border-b-0 lg:border-r">
          {source ? (
            <>
              {/* Analiz şeridi — ne olduğu + sektör; otomatik switch'i */}
              <div className="border-ui-border-base flex shrink-0 items-center justify-between gap-x-3 rounded-lg border p-2.5">
                <div className="flex min-w-0 items-center gap-x-2">
                  <MagnifyingGlass className="text-ui-fg-interactive shrink-0" />
                  {analyzeMut.isPending ? (
                    <Text size="small" className="text-ui-fg-subtle">
                      Analiz ediliyor…
                    </Text>
                  ) : analysis ? (
                    <>
                      <Text size="small" className="truncate">
                        {analysis.summary || "Analiz tamam"}
                      </Text>
                      {suggestedSector && (
                        <Badge size="2xsmall" color="blue" className="shrink-0">
                          {SECTOR_LABELS[suggestedSector] ?? suggestedSector}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      Analiz edilmedi
                    </Text>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-x-3">
                  {!autoAnalyze && !analyzeMut.isPending && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() =>
                        runAnalyze({ data: source.data, mime: source.mime })
                      }
                    >
                      <MagnifyingGlass />
                      Analiz et
                    </Button>
                  )}
                  <div className="flex items-center gap-x-1.5">
                    <Switch
                      checked={autoAnalyze}
                      onCheckedChange={toggleAutoAnalyze}
                    />
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Otomatik
                    </Text>
                  </div>
                </div>
              </div>

              <div
                className="border-ui-border-base bg-ui-bg-subtle relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-xl border p-3"
                style={CHECKERBOARD}
              >
                {current > 0 ? (
                  <CompareSlider before={original.url} after={source.url} />
                ) : (
                  <img
                    src={source.url}
                    alt={source.label}
                    className="max-h-full w-auto rounded-lg object-contain shadow-sm"
                  />
                )}
                {editing && (
                  <div className="bg-ui-bg-base/60 absolute inset-0 flex flex-col items-center justify-center gap-y-2 backdrop-blur-sm">
                    <Spinner className="text-ui-fg-interactive animate-spin" />
                    <Text size="small" className="text-ui-fg-base">
                      AI görseli düzenliyor…
                    </Text>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Text size="xsmall" className="text-ui-fg-muted">
                  {source.label} · {versions.length} versiyon
                </Text>
                <div className="flex items-center gap-x-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setEditorOpen(true)}
                  >
                    <PencilSquare />
                    Düzenle
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={saveImage}
                    isLoading={saveMut.isPending}
                  >
                    <SquaresPlus />
                    Kaydet
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleCreateProduct}
                    isLoading={createProductMut.isPending}
                  >
                    <Buildings />
                    Ürün olarak ekle
                  </Button>
                  <a href={source.url} download={`${source.label}.png`}>
                    <Button variant="secondary" size="small">
                      <ArrowDownTray />
                      İndir
                    </Button>
                  </a>
                  <Button variant="transparent" size="small" onClick={resetAll}>
                    Yeni görsel
                  </Button>
                </div>
              </div>

              {/* Opsiyonel 3D kapısı — kullanıcıya sorulur (§5c adım 2). İstemezse
                  hiç oluşturulmaz; her hâlükârda içerik üretimine devam edilir. */}
              <div className="border-ui-border-base bg-ui-bg-subtle flex flex-col gap-y-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-x-2">
                  <CubeSolid className="text-ui-fg-interactive shrink-0" />
                  <Text size="small" className="text-ui-fg-subtle">
                    İstersen ürününü{" "}
                    <span className="text-ui-fg-base font-medium">3D'ye çevir</span> — opsiyonel.
                    Sonra bu varlıklarla içerik üretmeye devam edersin.
                  </Text>
                </div>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setPanel("3d")}
                  className="shrink-0"
                >
                  3D'ye çevir
                </Button>
              </div>
            </>
          ) : (
            <div className="border-ui-border-base bg-ui-bg-subtle relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-xl border p-6">
              <div className="bg-ui-bg-base border-ui-border-base shadow-elevation-card-rest animate-in fade-in-0 zoom-in-95 flex w-full max-w-md flex-col items-center gap-y-5 rounded-xl border p-8 text-center duration-300 ease-out motion-reduce:animate-none">
                <div className="bg-ui-bg-subtle text-ui-fg-interactive flex size-14 items-center justify-center rounded-full">
                  <Photo />
                </div>
                <div className="flex flex-col items-center gap-y-1.5">
                  <Heading level="h3">Bir görselle başla</Heading>
                  <Text size="small" className="text-ui-fg-subtle">
                    Düzenlenecek görseli veya referansı yükle; sonra AI ile
                    düzenle, metin üret, hazır prompt uygula.
                  </Text>
                </div>
                <div className="w-full">
                  <FileUpload
                    label="Sürükle ya da seç"
                    hint="JPEG, PNG, WebP"
                    multiple={false}
                    formats={IMAGE_FORMATS}
                    maxFileSize={Infinity}
                    onUploaded={handleUpload}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="text-ui-fg-subtle hover:text-ui-fg-base text-xs font-medium"
                >
                  veya kütüphaneden seç
                </button>
              </div>
            </div>
          )}

          {(briefs.length > 0 || texts.length > 0) && (
            <div className="flex flex-col gap-y-3 border-t pt-4">
              <div className="flex items-center gap-x-2">
                <DocumentText className="text-ui-fg-subtle" />
                <Text weight="plus">Üretilen içerik</Text>
              </div>
              {briefs.map((b, bi) => (
                <div
                  key={bi}
                  className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-y-3 duration-300 ease-out motion-reduce:animate-none"
                >
                  <Badge size="2xsmall" color="blue">
                    <Language className="mr-1 inline" />
                    {b.language}
                  </Badge>
                  <BriefCard brief={b.brief} />
                  {b.variants.map((v) => (
                    <VariantCard key={v.platform} variant={v} />
                  ))}
                </div>
              ))}
              {texts.map((t, i) => (
                <div
                  key={i}
                  className="border-ui-border-base animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-y-1 rounded-xl border p-4 duration-300 ease-out motion-reduce:animate-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                      <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">
                        {t.title}
                      </Text>
                      {t.language && (
                        <Badge size="2xsmall" color="blue">
                          {t.language}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-x-1">
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => saveText(t.title, t.text, t.language)}
                      >
                        <SquaresPlus />
                      </IconButton>
                      <CopyButton value={t.text} />
                    </div>
                  </div>
                  <Text size="small" className="whitespace-pre-wrap">
                    {t.text}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: tek panel — düzenle araçları VEYA galeri (canvas'la yan yana) */}
        <div className="min-h-0 overflow-y-auto p-6">
          <div className={clx(panel !== "image" && "hidden")}>
            {imageMethod === "pack" ? (
              <div className="flex flex-col gap-y-3">
                <button
                  type="button"
                  onClick={() => setImageMethod("free")}
                  className="text-ui-fg-subtle hover:text-ui-fg-base self-start text-xs font-medium"
                >
                  ← Düzenlemeye dön
                </button>
                <PackPicker
                  suggestedSector={suggestedSector}
                  analysisFields={analysis?.fields}
                  brandProfile={brandProfile}
                  hasImage={!!source}
                  busy={editing}
                  onGenerate={(instruction, label) =>
                    runEdit({ instruction }, label)
                  }
                  onEditBrand={() => setBrandOpen(true)}
                />
              </div>
            ) : (
              <ImageTab
                source={source}
                onApply={(p) => runEdit({ prompt: p }, p)}
                onResult={applyImageResult}
                busy={editing}
                hasImage={!!source}
                method={imageMethod}
                setMethod={setImageMethod}
              />
            )}
          </div>
          <div className={clx(panel !== "text" && "hidden")}>
            {textMethod === "library" ? (
              <div className="flex flex-col gap-y-3">
                <button
                  type="button"
                  onClick={() => setTextMethod("quick")}
                  className="text-ui-fg-subtle hover:text-ui-fg-base self-start text-xs font-medium"
                >
                  ← Hızlı metne dön
                </button>
                <PromptLibrarySection
                  kind="text"
                  languages={languages}
                  onApplyImage={async () => {}}
                  onText={addText}
                  busy={false}
                  brandProfile={brandProfile}
                  onEditBrand={() => setBrandOpen(true)}
                />
              </div>
            ) : (
              <TextTab
                source={source}
                languages={languages}
                onBrief={addBrief}
                hasImage={!!source}
                method={textMethod}
                setMethod={setTextMethod}
              />
            )}
          </div>
          <div className={clx(panel !== "3d" && "hidden")}>
            <ThreeDTab
              source={source}
              onVersion={applyImageResult}
              onDone={() => setThreeDDone(true)}
            />
          </div>
          <div
            className={clx(
              "flex flex-col gap-y-4",
              panel !== "publish" && "hidden"
            )}
          >
            <div className="flex items-center gap-x-2">
              <PaperPlane className="text-ui-fg-interactive" />
              <Text weight="plus">Yayınla</Text>
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              Ürettiğin görsel + metni seçili sosyal hesaplara gönder — taslak,
              zamanla ya da hemen.
            </Text>

            {source ? (
              <img
                src={source.url}
                alt="Yayınlanacak görsel"
                className="border-ui-border-base max-h-44 w-full rounded-lg border object-contain"
              />
            ) : (
              <Text size="small" className="text-ui-fg-muted">
                Görsel opsiyonel — metinle de paylaşabilirsin.
              </Text>
            )}

            {texts.length > 0 && (
              <div className="flex flex-col gap-y-1.5">
                <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wide">
                  Metin seç
                </Text>
                {texts.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPubTextIdx(i)}
                    className={clx(
                      "rounded-lg border p-2.5 text-left transition-colors",
                      i === pubTextIdx
                        ? "border-ui-border-interactive bg-ui-bg-base"
                        : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base"
                    )}
                  >
                    <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                      {t.title}
                    </Text>
                    <Text size="small" className="line-clamp-2">
                      {t.text}
                    </Text>
                  </button>
                ))}
              </div>
            )}

            <Button onClick={() => setComposerOpen(true)} className="w-fit">
              <PaperPlane />
              Paylaş
            </Button>
          </div>
        </div>
      </div>
      <PublishComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initialContent={texts[pubTextIdx]?.text}
        initialImage={source?.url}
      />
    </Container>
  )
}

const Header = ({
  panel,
  setPanel,
  statuses,
  languages,
  setLanguages,
  onOpenLibrary,
  onOpenBrand,
  brandSet,
}: {
  panel: Panel
  setPanel: (p: Panel) => void
  statuses: Record<Panel, ProgressStatus>
  languages: string[]
  setLanguages: (fn: (prev: string[]) => string[]) => void
  onOpenLibrary: () => void
  onOpenBrand: () => void
  /** marka kurulu mu — kurulu değilse "Markanı kur" nudge'ı öne çıkar */
  brandSet: boolean
}) => {
  const addLanguage = (l: string) =>
    setLanguages((prev) => (prev.includes(l) ? prev : [...prev, l]))
  const removeLanguage = (l: string) =>
    setLanguages((prev) => (prev.length > 1 ? prev.filter((x) => x !== l) : prev))
  const available = LANGUAGES.filter((l) => !languages.includes(l))

  return (
    <div className="flex shrink-0 flex-col gap-y-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Sol: başlık + pipeline stepper */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-x-2">
          <Sparkles className="text-ui-fg-interactive" />
          <Heading level="h2">İçerik Stüdyosu</Heading>
        </div>
        {/* Pipeline stepper: ① Görsel/Video → ② Metin → ③ Yayın */}
        <div className="flex items-center gap-x-0.5">
          {[
            { value: "image" as Panel, label: "Görsel / Video", Icon: Photo },
            { value: "3d" as Panel, label: "3D / 360°", Icon: CubeSolid },
            { value: "text" as Panel, label: "Metin", Icon: DocumentText },
            { value: "publish" as Panel, label: "Yayın", Icon: PaperPlane },
          ].map((s, i) => {
            const active = panel === s.value
            const done = statuses[s.value] === "completed"
            const Icon = s.Icon
            return (
              <Fragment key={s.value}>
                {i > 0 && (
                  <ChevronRightMini className="text-ui-fg-muted shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => setPanel(s.value)}
                  aria-current={active ? "step" : undefined}
                  className={clx(
                    "flex items-center gap-x-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors duration-100",
                    active
                      ? "bg-ui-bg-base text-ui-fg-base shadow-borders-base"
                      : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle"
                  )}
                >
                  <span
                    className={clx(
                      "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      done
                        ? "bg-ui-tag-green-bg text-ui-tag-green-text"
                        : active
                          ? "bg-ui-bg-interactive text-ui-fg-on-color"
                          : "bg-ui-bg-subtle text-ui-fg-muted"
                    )}
                  >
                    {done ? <CheckMini /> : i + 1}
                  </span>
                  <Icon />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* Sağ: kütüphane + çoklu çıktı dili */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={brandSet ? "secondary" : "primary"}
          size="small"
          onClick={onOpenBrand}
        >
          <Buildings />
          {brandSet ? "Marka" : "Markanı kur"}
          {!brandSet && (
            <span className="bg-ui-tag-orange-icon ml-1 size-1.5 rounded-full" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={onOpenLibrary}
          className="mr-1"
        >
          <SquaresPlus />
          Kütüphane
        </Button>
        <GlobeEurope className="text-ui-fg-subtle" />
        {languages.map((l) => (
          <Badge
            key={l}
            size="2xsmall"
            className="flex items-center gap-x-1"
            color="blue"
          >
            {l}
            {languages.length > 1 && (
              <button
                type="button"
                onClick={() => removeLanguage(l)}
                className="hover:text-ui-fg-base"
              >
                <XMarkMini />
              </button>
            )}
          </Badge>
        ))}
        {available.length > 0 && (
          <Select value="" onValueChange={addLanguage}>
            <Select.Trigger className="h-7 w-[108px]">
              <div className="text-ui-fg-subtle flex items-center gap-x-1 whitespace-nowrap">
                <Plus />
                <Text size="xsmall">Dil ekle</Text>
              </div>
            </Select.Trigger>
            <Select.Content>
              {available.map((l) => (
                <Select.Item key={l} value={l}>
                  {l}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        )}
      </div>
    </div>
  )
}
