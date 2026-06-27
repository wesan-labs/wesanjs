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
  prompt?: string
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
