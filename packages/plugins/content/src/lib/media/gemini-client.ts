/**
 * Reusable Gemini/Google AI istemcisi — plugin-AGNOSTİK (Medusa bağımlılığı YOK,
 * düz fetch + Error). Metin (JSON), görsel (Nano Banana) ve video (Veo) tek yerde.
 * Başka modül/servis de import edip kullanabilir. Tek env: GEMINI_API_KEY.
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta"

const DEFAULTS = {
  text: "gemini-2.5-flash",
  image: "gemini-2.5-flash-image", // Nano Banana
  video: "veo-3.1-generate-preview",
} as const

/** base64 (prefix'siz) + mime. Provider'lara bu şekilde gider. */
export interface MediaImage {
  mime: string
  data: string
}

const key = (): string => {
  const k = process.env.GEMINI_API_KEY
  if (!k) throw new Error("GEMINI_API_KEY tanımlı değil")
  return k
}

/** "data:image/png;base64,AAA" → { mime, data }. Saf. */
export const parseDataUrl = (dataUrl: string): MediaImage => {
  const comma = dataUrl.indexOf(",")
  const meta = dataUrl.slice(5, dataUrl.indexOf(";"))
  return { mime: meta || "image/png", data: dataUrl.slice(comma + 1) }
}

/** { mime, data } → "data:...;base64,...". Saf. */
export const toDataUrl = (img: MediaImage): string => `data:${img.mime};base64,${img.data}`

const asFetchError = async (res: Response): Promise<never> => {
  const t = await res.text().catch(() => "")
  throw new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`)
}

/** Metin üretimi (JSON veya düz). Reusable. */
export const geminiGenerate = async (opts: {
  text: string
  system?: string
  images?: MediaImage[]
  model?: string
  json?: boolean
  temperature?: number
  maxOutputTokens?: number
}): Promise<string> => {
  const model = opts.model ?? process.env.GEMINI_MODEL ?? DEFAULTS.text
  const parts: Record<string, unknown>[] = [{ text: opts.text }]
  for (const img of opts.images ?? []) {
    parts.push({ inline_data: { mime_type: img.mime, data: img.data } })
  }
  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxOutputTokens ?? 2000,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  })
  if (!res.ok) return asFetchError(res)
  const json: any = await res.json()
  const out = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text)
    .filter(Boolean)
    .join("")
  if (!out) throw new Error("Gemini boş yanıt döndürdü")
  return out
}

/** Görsel üretim/düzenleme (Nano Banana). Çıktı: data-URL. Reusable. */
export const geminiImage = async (opts: {
  prompt: string
  images?: MediaImage[]
  model?: string
}): Promise<string> => {
  const model = opts.model ?? process.env.GEMINI_IMAGE_MODEL ?? DEFAULTS.image
  const parts: Record<string, unknown>[] = [{ text: opts.prompt }]
  for (const img of opts.images ?? []) {
    parts.push({ inline_data: { mime_type: img.mime, data: img.data } })
  }
  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  })
  if (!res.ok) return asFetchError(res)
  const json: any = await res.json()
  const img = (json?.candidates?.[0]?.content?.parts ?? []).find((p: any) => p?.inline_data ?? p?.inlineData)
  const inline = img?.inline_data ?? img?.inlineData
  if (!inline?.data) throw new Error("Gemini görsel döndürmedi")
  return toDataUrl({ mime: inline.mime_type ?? inline.mimeType ?? "image/png", data: inline.data })
}

/** Veo image→video job aç → operation adı. Async (uzun-süren). Reusable. */
export const veoSubmit = async (opts: {
  prompt: string
  image: MediaImage
  model?: string
  aspectRatio?: string
}): Promise<{ operation: string }> => {
  const model = opts.model ?? process.env.VEO_MODEL ?? DEFAULTS.video
  const res = await fetch(`${BASE}/models/${model}:predictLongRunning?key=${key()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: opts.prompt, image: { bytesBase64Encoded: opts.image.data, mimeType: opts.image.mime } }],
      parameters: { aspectRatio: opts.aspectRatio ?? "16:9" },
    }),
  })
  if (!res.ok) return asFetchError(res)
  const json: any = await res.json()
  if (!json?.name) throw new Error(json?.error?.message ?? "Veo operation adı yok")
  return { operation: json.name }
}

/** Veo operation poll → { done, videoUri? }. videoUri sunucu-taraf indirmede &key ister. */
export const veoPoll = async (
  operation: string
): Promise<{ done: boolean; videoUri?: string; error?: string }> => {
  const res = await fetch(`${BASE}/${operation}?key=${key()}`)
  if (!res.ok) return asFetchError(res)
  const json: any = await res.json()
  if (!json?.done) return { done: false }
  const uri = json?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
  return { done: true, videoUri: uri, error: uri ? undefined : json?.error?.message ?? "video uri yok" }
}

/** Veo video URI'sini sunucu-taraf indir (key ekli). Reusable. */
export const veoDownloadUrl = (videoUri: string): string =>
  `${videoUri}${videoUri.includes("?") ? "&" : "?"}key=${key()}`
