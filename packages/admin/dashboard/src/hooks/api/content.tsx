import { FetchError } from "@medusajs/js-sdk"
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"

/**
 * Content generation contract — shared shape between this hook and the custom
 * backend route `POST /admin/content/generate`. Kept here (not in @medusajs
 * /types) because it is app-specific and not part of the core HTTP types.
 */
export type ContentPlatform = string

/** A platform + format target, e.g. Instagram · Reels. */
export interface ContentTarget {
  platform: string
  format: string
  /** display + identity, e.g. "Instagram · Reels" */
  label: string
}

export type ContentTone = "casual" | "professional" | "bold" | "playful"

/** Output language as a display name, e.g. "Türkçe", "English", "Deutsch". */
export type ContentLanguage = string

export interface GenerateContentImage {
  /** base64-encoded payload WITHOUT the data-url prefix */
  data: string
  /** e.g. "image/jpeg" */
  mime: string
}

export interface GenerateContentInput {
  /** still images, or frames sampled from a video when media_type === "video" */
  images: GenerateContentImage[]
  targets: ContentTarget[]
  tone: ContentTone
  language: ContentLanguage
  /** optional free-text intent, e.g. "ürün lansmanı, indirim duyurusu" */
  goal?: string
  media_type?: "image" | "video"
}

export interface ContentBrief {
  scene_analysis: string
  hook: string
  body: string
  cta: string
  /** reusable prompt to regenerate/vary the visual */
  reusable_prompt: string
}

export interface ContentVariant {
  /** identity = the target label, e.g. "Instagram · Reels" */
  label: string
  platform: string
  format: string
  caption: string
  hashtags: string[]
  alt_text: string
  /** human-readable suggested posting window, e.g. "Akşam 19:00–21:00" */
  suggested_time: string
}

export interface GenerateContentResponse {
  generation: {
    id: string
    brief: ContentBrief
    variants: ContentVariant[]
  }
}

/**
 * Convert a browser File to base64 (sans data-url prefix) for JSON transport.
 * Time: O(n) over file bytes. Space: O(n) for the encoded string.
 */
export const fileToBase64 = (file: File): Promise<GenerateContentImage> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(",")
      resolve({ data: result.slice(comma + 1), mime: file.type })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * Sample N frames from a video file entirely in the browser (video + canvas),
 * downscaled to keep the JSON payload small. Lets free image-only vision models
 * "see" a video without server-side ffmpeg.
 * Time: O(count) seeks. Space: O(count) encoded frames.
 */
export const extractVideoFrames = (
  file: File,
  count = 3,
  maxDim = 1024
): Promise<GenerateContentImage[]> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "auto"
    video.muted = true
    video.playsInline = true
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl

    const canvas = document.createElement("canvas")
    const frames: GenerateContentImage[] = []
    let stamps: number[] = []
    let idx = 0

    const cleanup = () => URL.revokeObjectURL(objectUrl)

    const seekNext = () => {
      if (idx >= stamps.length) {
        cleanup()
        resolve(frames)
        return
      }
      video.currentTime = stamps[idx]
    }

    video.onloadedmetadata = () => {
      const duration = video.duration || 0
      // Sample inside the clip (avoid black first/last frames).
      stamps = Array.from(
        { length: count },
        (_, i) => (duration * (i + 1)) / (count + 1)
      )
      seekNext()
    }

    video.onseeked = () => {
      const w = video.videoWidth
      const h = video.videoHeight
      const scale = Math.min(1, maxDim / Math.max(w, h || 1))
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
        frames.push({
          data: dataUrl.slice(dataUrl.indexOf(",") + 1),
          mime: "image/jpeg",
        })
      }
      idx++
      seekNext()
    }

    video.onerror = () => {
      cleanup()
      reject(new Error("Video okunamadı"))
    }
  })

/**
 * Downscale + re-encode an image File to keep the base64 payload small.
 * Falls back to the raw bytes if the browser can't decode it (e.g. HEIC).
 * Time: O(pixels). Space: O(downscaled pixels).
 */
export const downscaleImage = (
  file: File,
  maxDim = 1280,
  quality = 0.72
): Promise<GenerateContentImage> =>
  new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height || 1))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext("2d")
      URL.revokeObjectURL(objectUrl)
      if (!ctx) {
        fileToBase64(file).then(resolve)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL("image/jpeg", quality)
      resolve({
        data: dataUrl.slice(dataUrl.indexOf(",") + 1),
        mime: "image/jpeg",
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      fileToBase64(file).then(resolve) // HEIC/unknown → send original
    }
    img.src = objectUrl
  })

export const useGenerateContent = (
  options?: UseMutationOptions<
    GenerateContentResponse,
    FetchError,
    GenerateContentInput
  >
) =>
  useMutation({
    mutationFn: (input: GenerateContentInput) =>
      sdk.client.fetch<GenerateContentResponse>("/admin/content/generate", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/* ── Image analysis (vision → sector + brand hints) ──────────────────── */

export interface AnalyzeResult {
  /** mobile-game | mobile-app | saas-web | furniture | other */
  sector: string
  summary: string
  fields: Record<string, string>
}

export const useAnalyzeImage = (
  options?: UseMutationOptions<
    { analysis: AnalyzeResult },
    FetchError,
    GenerateContentImage
  >
) =>
  useMutation({
    mutationFn: (image: GenerateContentImage) =>
      sdk.client.fetch<{ analysis: AnalyzeResult }>("/admin/content/analyze", {
        method: "POST",
        body: { image },
      }),
    ...options,
  })

/* ── Saved content library (persisted) ───────────────────────────────── */

export interface ContentItem {
  id: string
  kind: "image" | "text"
  title?: string | null
  value: string
  language?: string | null
  platform?: string | null
  prompt_id?: string | null
  created_at: string
}

export interface SaveContentItemInput {
  kind: "image" | "text"
  value: string
  title?: string | null
  language?: string | null
  platform?: string | null
  prompt_id?: string | null
}

const CONTENT_ITEMS_KEY = "content-items"

export const useContentItems = (
  options?: Omit<
    UseQueryOptions<{ items: ContentItem[]; count: number }, FetchError>,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: [CONTENT_ITEMS_KEY],
    queryFn: () =>
      sdk.client.fetch<{ items: ContentItem[]; count: number }>(
        "/admin/content/items"
      ),
    ...options,
  })

export const useSaveContentItem = (
  options?: UseMutationOptions<
    { item: ContentItem },
    FetchError,
    SaveContentItemInput
  >
) =>
  useMutation({
    mutationFn: (input: SaveContentItemInput) =>
      sdk.client.fetch<{ item: ContentItem }>("/admin/content/items", {
        method: "POST",
        body: input,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEMS_KEY] }),
    ...options,
  })

export const useDeleteContentItem = (
  options?: UseMutationOptions<{ id: string }, FetchError, string>
) =>
  useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<{ id: string }>(`/admin/content/items/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEMS_KEY] }),
    ...options,
  })

/* ── Image editing (image + prompt → new image) ──────────────────────── */

export interface EditImageInput {
  image: GenerateContentImage
  /** pack compose'dan gelen deterministik instruction — tek hop (LLM ara katmanı yok) */
  instruction?: string
  prompt?: string
  /** @deprecated 2-hop library path — pack compose'a geç */
  promptId?: string
  variables?: Record<string, string>
}

export interface EditImageResponse {
  /** edited image as a data:image/...;base64,... URL */
  image: string
}

export const useEditImage = (
  options?: UseMutationOptions<EditImageResponse, FetchError, EditImageInput>
) =>
  useMutation({
    mutationFn: (input: EditImageInput) =>
      sdk.client.fetch<EditImageResponse>("/admin/content/edit-image", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/** Split a data URL into the base64 payload + mime the edit endpoint expects. */
export const dataUrlToImage = (dataUrl: string): GenerateContentImage => {
  const comma = dataUrl.indexOf(",")
  const mimeMatch = dataUrl.slice(5, comma).split(";")[0]
  return { data: dataUrl.slice(comma + 1), mime: mimeMatch || "image/png" }
}

/* ── Prompt library (333 structured prompts) ─────────────────────────── */

export interface PromptListItem {
  id: string
  platform: string
  content_type: string
  funnel_stage: string
  tone: string
  sector: string
  /** "transform" edits the uploaded image; "generate" makes new art */
  mode: "transform" | "generate"
  title: string
  goal: string
  template: string
  output: { format: string; shape: string }
  variables: string[]
  tags: string[]
}

export interface PromptSector {
  id: string
  label: string
}

export interface PromptVariableMeta {
  type: string
  example?: string
  default?: string
  values?: string[]
  enum_example?: string[]
  description?: string
}

export interface PromptLibraryMeta {
  platforms: string[]
  content_types: string[]
  funnel_stages: string[]
  tones: Record<string, string>
  sectors: PromptSector[]
  variables: Record<string, PromptVariableMeta>
  counts: { prompts: number; data_banks: number }
}

export interface PromptListResponse {
  prompts: PromptListItem[]
  count: number
  meta: PromptLibraryMeta
}

export interface PromptFilters {
  platform?: string
  content_type?: string
  funnel_stage?: string
  tone?: string
  sector?: string
  q?: string
}

export const usePrompts = (
  filters: PromptFilters = {},
  options?: Omit<
    UseQueryOptions<PromptListResponse, FetchError>,
    "queryFn" | "queryKey"
  >
) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v)
  })
  const qs = params.toString()
  return useQuery({
    queryKey: ["content-prompts", filters],
    queryFn: () =>
      sdk.client.fetch<PromptListResponse>(
        `/admin/content/prompts${qs ? `?${qs}` : ""}`
      ),
    ...options,
  })
}

export interface RunPromptResponse {
  id: string
  title: string
  output: { format: string; shape: string }
  text: string
}

export interface ExamplePromptResponse {
  kind: "text" | "image"
  text?: string
  /** data URL when kind === "image" */
  image?: string
}

export const useExamplePrompt = (
  options?: UseMutationOptions<
    ExamplePromptResponse,
    FetchError,
    { id: string; variables: Record<string, string> }
  >
) =>
  useMutation({
    mutationFn: (input: { id: string; variables: Record<string, string> }) =>
      sdk.client.fetch<ExamplePromptResponse>(
        "/admin/content/prompts/example",
        { method: "POST", body: input }
      ),
    ...options,
  })

export const useRunPrompt = (
  options?: UseMutationOptions<
    RunPromptResponse,
    FetchError,
    { id: string; variables: Record<string, string> }
  >
) =>
  useMutation({
    mutationFn: (input: { id: string; variables: Record<string, string> }) =>
      sdk.client.fetch<RunPromptResponse>("/admin/content/prompts/run", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/* ── Pack engine (deterministik görsel talimatı — LLM yok) ────────────── */

export interface PackShot {
  id: string
  label: string
  mode: "transform" | "generate"
  aspect: string
}

export interface PackCategory {
  id: string
  label: string
  /** UI'nın soracağı metadata alan anahtarları (furniture: color/legs; game: GAME_NAME…) */
  metadataSchema: string[]
  shots: PackShot[]
}

export interface PackSummary {
  id: string
  sector: string
  label: string
  categories: PackCategory[]
}

export const usePacks = (
  options?: Omit<
    UseQueryOptions<{ packs: PackSummary[] }, FetchError>,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: ["content-packs"],
    queryFn: () =>
      sdk.client.fetch<{ packs: PackSummary[] }>("/admin/content/packs"),
    ...options,
  })

/** Template (Canva-tarzı sahne) — backend lib/templates/types.ts aynası. */
export interface ContentTemplate {
  id: string
  kind: "image"
  format: string
  label: string
  domainTags?: string[]
  scene: {
    width: number
    height: number
    background?: string
    nodes: Array<{
      type: "Rect" | "Text" | "Image" | "Group"
      id: string
      slotId?: string
      attrs: Record<string, any>
      children?: unknown[]
    }>
  }
  slots: Array<{ id: string; bind: Record<string, any> }>
  thumbnail?: string
}

/**
 * Kürlenmiş template kütüphanesi. `domain` verilirse markaya-önerili sıra.
 * queryKey'e domain girer → marka değişince yeniden sıralama fetch'lenir.
 */
export const useTemplates = (
  domain?: string,
  options?: Omit<
    UseQueryOptions<{ templates: ContentTemplate[] }, FetchError>,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: ["content-templates", domain ?? ""],
    queryFn: () =>
      sdk.client.fetch<{ templates: ContentTemplate[] }>("/admin/content/templates", {
        query: domain ? { domain } : undefined,
      }),
    ...options,
  })

export interface FillTemplateInput {
  templateId?: string
  template?: ContentTemplate
  brand: BrandIdentity
  media?: string
  logo?: string
}

export interface FillTemplateResponse {
  scene: ContentTemplate["scene"]
  fillData: Record<string, { kind: string; value: string }>
}

/**
 * Template + marka → doldurulmuş sahne (deterministik; POST /templates/fill).
 * scene editöre girer, fillData denetime. LLM kopya + AI görsel backend'de sonra.
 */
export const useFillTemplate = (
  options?: UseMutationOptions<FillTemplateResponse, FetchError, FillTemplateInput>
) =>
  useMutation({
    mutationFn: (input: FillTemplateInput) =>
      sdk.client.fetch<FillTemplateResponse>("/admin/content/templates/fill", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/** 3D ürün varlığı — backend Product3DAssetDTO aynası. */
export interface Product3DAsset {
  id: string
  tenant_id: string | null
  brand_id: string | null
  source: "physical" | "digital-mockup"
  product_ref: string | null
  inputs: string[]
  pipeline_step: string | null
  step_job_id: string | null
  step_poll_url: string | null
  hero_url: string | null
  video_url: string | null
  turntable_urls: string[] | null
  mesh_url: string | null
  thumbnail_url: string | null
  provider: string
  provider_task_id: string | null
  status: "processing" | "ready" | "failed"
  error: string | null
}

export interface Create3DInput {
  images: string[]
  source?: "physical" | "digital-mockup"
  brand_id?: string
  product_ref?: string
}

/** Pipeline adım tanımı (§5b) — UI operasyon kartları bundan render olur. */
export interface PipelineStepInfo {
  op: string
  label: string
  op_spec: string | null
  provider: string
  params: Record<string, string | number>
  env_key: string | null
  key_configured: boolean
}

/** Outcome-akış tek-geçiş taslağı (§3.1 ③) — hero görsel + açıklama + caption. */
export interface StudioDraft {
  heroImage: string
  description: string
  caption: string
}

export interface StudioDraftInput {
  images: string[]
  product_name?: string
}

/** Ürün fotoğraflarından satışa-hazır taslak üret (tek çağrı). */
export const useStudioDraft = (
  options?: UseMutationOptions<{ draft: StudioDraft }, FetchError, StudioDraftInput>
) =>
  useMutation({
    mutationFn: (input: StudioDraftInput) =>
      sdk.client.fetch<{ draft: StudioDraft }>("/admin/content/studio/draft", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/** Sadece temiz görseli yeniden üret (review "yeniden"). */
export const useStudioHero = (
  options?: UseMutationOptions<{ image: string }, FetchError, { images: string[] }>
) =>
  useMutation({
    mutationFn: (input: { images: string[] }) =>
      sdk.client.fetch<{ image: string }>("/admin/content/studio/hero", { method: "POST", body: input }),
    ...options,
  })

/** Sadece metni yeniden yaz. */
export const useStudioCopy = (
  options?: UseMutationOptions<
    { description: string; caption: string },
    FetchError,
    { images: string[]; product_name?: string }
  >
) =>
  useMutation({
    mutationFn: (input: { images: string[]; product_name?: string }) =>
      sdk.client.fetch<{ description: string; caption: string }>("/admin/content/studio/copy", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

export interface CreateContentProductInput {
  title: string
  images: string[]
  product_ref?: string
  description?: string
  status?: "draft" | "published"
}

/** Stüdyo varlıklarını (görseller) bir Medusa ÜRÜNÜNE çevir (§5c adım 3, native). */
export const useCreateContentProduct = (
  options?: UseMutationOptions<{ product: { id: string; title: string } }, FetchError, CreateContentProductInput>
) =>
  useMutation({
    mutationFn: (input: CreateContentProductInput) =>
      sdk.client.fetch<{ product: { id: string; title: string } }>("/admin/content/product", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/** Pipeline TANIMINI getir (op kartları: op-spec + provider + params + key durumu). */
export const use3DPipeline = () =>
  useQuery({
    queryKey: ["content-3d-pipeline"],
    queryFn: () =>
      sdk.client.fetch<{ steps: PipelineStepInfo[] }>("/admin/content/3d/pipeline"),
    staleTime: 60_000,
  })

/** Foto(lar)dan 3D varlık üretimi başlat (POST /3d → `processing`). */
export const useCreate3DAsset = (
  options?: UseMutationOptions<{ asset: Product3DAsset }, FetchError, Create3DInput>
) =>
  useMutation({
    mutationFn: (input: Create3DInput) =>
      sdk.client.fetch<{ asset: Product3DAsset }>("/admin/content/3d", {
        method: "POST",
        body: input,
      }),
    ...options,
  })

/** Tek varlığı getir; `processing` iken 3 sn'de bir poll (backend poll-on-read). */
export const use3DAsset = (id?: string) =>
  useQuery({
    queryKey: ["content-3d-asset", id],
    queryFn: () =>
      sdk.client.fetch<{ asset: Product3DAsset }>(`/admin/content/3d/${id}`),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.asset?.status === "processing" ? 3000 : false,
  })

/** Tenant-kapsamlı 3D varlık listesi. */
export const use3DAssets = (
  options?: Omit<
    UseQueryOptions<{ assets: Product3DAsset[]; count: number }, FetchError>,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: ["content-3d-assets"],
    queryFn: () =>
      sdk.client.fetch<{ assets: Product3DAsset[]; count: number }>("/admin/content/3d"),
    ...options,
  })

/** Marka kimliği — derleyiciye giden çekirdek (backend BrandIdentity aynası). */
export interface BrandIdentity {
  id: string
  tenantId: string
  version: number
  name: string
  tagline?: string
  domain: string
  offering: string
  audience: string
  positioning?: string
  voice: {
    formality: number
    energy: number
    warmth: number
    complexity: number
    archetype?: string
  }
  vocabulary?: { neverUse?: string[]; forbiddenClaims?: string[] }
  visual: {
    colors: { primary: string; secondary?: string; accent?: string }
    photographyStyle?: string
    moodKeywords?: string[]
    compositionAvoid?: string[]
  }
}

export interface ComposeInput {
  /** hazır pack yolu VEYA (brand ile) derlenmiş pack yolu */
  packId?: string
  /** marka-güdümlü: derleyici pack'i cache'ler → compose (compile-and-cache) */
  brand?: BrandIdentity
  categoryId: string
  shotId: string
  metadata?: Record<string, string>
  style?: { aspect?: string; concept?: string }
}

export interface ComposeResponse {
  /** Gemini'ye giden tek deterministik metin */
  instruction: string
  mode: "transform" | "generate"
  meta: {
    packId: string
    categoryId: string
    shotId: string
    templateVersion: string
  }
}

export const useCompose = (
  options?: UseMutationOptions<ComposeResponse, FetchError, ComposeInput>
) =>
  useMutation({
    mutationFn: (input: ComposeInput) =>
      sdk.client.fetch<ComposeResponse>("/admin/content/compose", {
        method: "POST",
        body: input,
      }),
    ...options,
  })
