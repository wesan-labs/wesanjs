import { MedusaError } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * Provider-agnostic content generation.
 *
 * Today: OpenRouter (OpenAI-compatible) with a free vision model. Swap the
 * provider by changing `callChat` — the rest of the pipeline (prompt building,
 * JSON parsing, validation) is provider-independent. Model is env-configurable
 * so you can rotate free models without code changes.
 *
 * Known free vision slugs (set via OPENROUTER_MODEL, live-tested 2026-06):
 *   - google/gemma-4-31b-it:free        (best: vision + JSON + Turkish)
 *   - google/gemma-4-26b-a4b-it:free    (lighter fallback)
 */

/** Platform key, e.g. "instagram", "tiktok", "linkedin", "x", "youtube". */
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

export interface GenerateImage {
  data: string // base64, no data-url prefix
  mime: string
}

export interface GenerateInput {
  /** still images, OR frames sampled from a video when media_type === "video" */
  images: GenerateImage[]
  targets: ContentTarget[]
  tone: ContentTone
  language: ContentLanguage
  goal?: string
  media_type?: "image" | "video"
}

export interface ContentBrief {
  scene_analysis: string
  hook: string
  body: string
  cta: string
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
  suggested_time: string
}

export interface GenerationResult {
  id: string
  brief: ContentBrief
  variants: ContentVariant[]
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "google/gemini-2.5-flash"
/**
 * Fallback chain. With BYOK (own Google key added to OpenRouter), these Google
 * models route through the user's own quota → reliable. The trailing :free entry
 * is a last-resort that uses the shared free pool if BYOK is ever unavailable.
 */
const FALLBACK_MODELS = ["google/gemini-3.1-flash-lite", "google/gemma-4-31b-it:free"]
const MAX_IMAGES = 4

// Google AI Studio (Gemini) — separate, per-account free quota (not the shared
// OpenRouter pool), so it stays reliable. Used first when GEMINI_API_KEY is set.
const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash"
const USER_INSTRUCTION = "Bu görsel(ler) için içeriği üret. Yalnızca JSON döndür."

const TONE_LABEL: Record<ContentTone, string> = {
  casual: "samimi, sıcak, günlük",
  professional: "profesyonel, net, güven veren",
  bold: "iddialı, dikkat çekici, cesur",
  playful: "eğlenceli, esprili, oyuncu",
}

/** Per platform+format guidance — keyed by `${platform}-${format}`. */
const FORMAT_GUIDE: Record<string, string> = {
  "instagram-post":
    "Instagram Gönderi: 1-3 cümle akıcı estetik caption, 8-15 hashtag, emoji ölçülü.",
  "instagram-reels":
    "Instagram Reels: ilk saniyede güçlü hook, video script ritmi, trend/CTA, 3-8 hashtag.",
  "instagram-story":
    "Instagram Story: çok kısa tek satır, samimi, sticker/anket/CTA önerisi, hashtag minimal.",
  "instagram-carousel":
    "Instagram Karusel: ilk kare hook, kaydırmaya teşvik, kare kare madde önerisi, 5-12 hashtag.",
  "tiktok-video":
    "TikTok Video: konuşma dili hook, sahne sahne kısa script, trend/CTA, 3-6 hashtag.",
  "linkedin-post":
    "LinkedIn Gönderi: profesyonel, değer/öğreti odaklı, 1-2 kısa paragraf, 3-5 hashtag, emoji minimal.",
  "x-tweet":
    "X (Twitter) Tweet: 280 karakter altı, tek vurucu fikir, 1-2 hashtag.",
  "x-thread":
    "X Thread: ilk tweet güçlü hook + 3-5 numaralı tweet zinciri önerisi.",
  "youtube-short":
    "YouTube Short: güçlü hook + retention beat'leri, kısa script, başlık önerisi.",
  "facebook-post":
    "Facebook Gönderi: sıcak topluluk dili, biraz daha uzun caption, 2-4 hashtag.",
  "threads-post":
    "Threads Gönderi: sohbet başlatan samimi kısa metin, 0-2 hashtag.",
}

const targetGuide = (t: ContentTarget): string =>
  `- ${t.label}: ${
    FORMAT_GUIDE[`${t.platform}-${t.format}`] ??
    "platforma uygun, yayına hazır içerik."
  }`

// language is already a display name (e.g. "Türkçe", "Deutsch"); used as-is.

/**
 * Build the strict-JSON instruction prompt. Single responsibility: text only.
 */
const buildSystemPrompt = (input: GenerateInput): string => {
  const guides = input.targets.map(targetGuide).join("\n")
  const first = input.targets[0]
  const isVideo = input.media_type === "video"
  return [
    "Sen deneyimli bir sosyal medya içerik stratejistisin.",
    `Çıktı dili: ${input.language}. Ton: ${TONE_LABEL[input.tone]}.`,
    input.goal ? `Kampanya amacı/bağlamı: ${input.goal}.` : "",
    isVideo
      ? "ÖNEMLİ: Verilen görseller bir VIDEO'dan alınmış ardışık karelerdir. Bunları tek bir akış olarak değerlendir. body alanına sahne sahne kısa bir çekim/anlatım script'i yaz (açılış → gelişme → kapanış). hook ilk 3 saniyeyi yakalasın. Caption'lar Reels/TikTok video formatına uygun olsun."
      : "Sana verilen görsel(ler)i analiz et ve aşağıdaki KURALLARA göre içerik üret.",
    "Her HEDEF için ayrı, formatına UYGUN bir varyant üret (Story kısa, Reels script gibi, LinkedIn profesyonel...):",
    guides,
    "",
    "SADECE geçerli JSON döndür, başka hiçbir metin/markdown ekleme. Şema:",
    `{
  "brief": {
    "scene_analysis": "görselde ne var, ışık/renk/duygu kısa analiz",
    "hook": "dikkat çeken ilk cümle",
    "body": "ana mesaj gövdesi",
    "cta": "harekete geçirici çağrı",
    "reusable_prompt": "bu görseli/varyasyonu yeniden üretmek için detaylı bir görsel üretim prompt'u"
  },
  "variants": [
    {
      "label": "${first?.label ?? ""}",
      "platform": "${first?.platform ?? ""}",
      "format": "${first?.format ?? ""}",
      "caption": "bu hedefin formatına uygun, yayına hazır caption/script",
      "hashtags": ["#ornek", "#etiket"],
      "alt_text": "erişilebilirlik için görsel açıklaması",
      "suggested_time": "önerilen yayın zaman aralığı"
    }
  ]
}`,
    `variants dizisinde HER hedef için bir varyant olmalı; "label" alanı BİREBİR şu olmalı: ${input.targets
      .map((t) => t.label)
      .join(" | ")}.`,
  ]
    .filter(Boolean)
    .join("\n")
}

const buildUserContent = (input: GenerateInput) => {
  const parts: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: USER_INSTRUCTION,
    },
  ]
  for (const img of input.images.slice(0, MAX_IMAGES)) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${img.mime};base64,${img.data}` },
    })
  }
  return parts
}

/**
 * Defensive JSON extraction — free models sometimes wrap JSON in prose/markdown.
 * Time: O(n) over the response string.
 */
const parseJson = (raw: string): unknown => {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "")
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "AI yanıtı JSON olarak çözümlenemedi"
    )
  }
}

const validate = (
  data: any,
  targets: ContentTarget[]
): { brief: ContentBrief; variants: ContentVariant[] } => {
  const b = data?.brief
  if (!b?.hook || !b?.body || !b?.cta) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "AI yanıtında brief eksik"
    )
  }
  const byLabel = new Map(targets.map((t) => [t.label, t]))
  const variants: ContentVariant[] = (data?.variants ?? [])
    .map((v: any) => {
      // Match the model's variant back to a requested target (by label, else
      // by platform+format) so we keep correct platform/format metadata.
      const t =
        byLabel.get(v?.label) ??
        targets.find((x) => x.platform === v?.platform && x.format === v?.format)
      if (!t) return null
      return {
        label: t.label,
        platform: t.platform,
        format: t.format,
        caption: String(v.caption ?? ""),
        hashtags: Array.isArray(v.hashtags) ? v.hashtags.map(String) : [],
        alt_text: String(v.alt_text ?? ""),
        suggested_time: String(v.suggested_time ?? ""),
      }
    })
    .filter(Boolean) as ContentVariant[]
  if (!variants.length) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "AI yanıtında hedef varyantı yok"
    )
  }
  return {
    brief: {
      scene_analysis: String(b.scene_analysis ?? ""),
      hook: String(b.hook),
      body: String(b.body),
      cta: String(b.cta),
      reusable_prompt: String(b.reusable_prompt ?? ""),
    },
    variants,
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Preferred model (env or default) first, then the fallback chain, deduped. */
const buildModelChain = (): string[] => {
  const primary = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
  return [...new Set([primary, ...FALLBACK_MODELS])]
}

const requestModel = async (
  apiKey: string,
  model: string,
  system: string,
  userContent: unknown
): Promise<Response> =>
  fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://wesan.co",
      "X-Title": "Wesan Content Studio",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

/**
 * Calls OpenRouter with graceful degradation: walk the model chain, retrying
 * once on transient 429/5xx before moving to the next model. Only throws once
 * every model is exhausted, so a single rate-limited free model never surfaces
 * as a 500 to the user.
 */
const callOpenRouter = async (
  system: string,
  userContent: unknown
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "OPENROUTER_API_KEY tanımlı değil. helm/.env içine ekle."
    )
  }

  const chain = buildModelChain()
  const ROUNDS = 2 // free models are transiently rate-limited; a second pass often clears
  let lastError = "bilinmeyen hata"

  for (let round = 0; round < ROUNDS; round++) {
    for (const model of chain) {
      const res = await requestModel(apiKey, model, system, userContent)

      if (res.ok) {
        const json: any = await res.json()
        const content = json?.choices?.[0]?.message?.content
        if (typeof content === "string" && content.trim()) {
          return content
        }
        lastError = `${model}: boş yanıt`
        continue
      }

      lastError = `${model} (HTTP ${res.status})`
      // Brief backoff before trying the next model / next round.
      await sleep(round === 0 ? 400 : 1000)
    }
  }

  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    `Bedava modeller şu an meşgul (${lastError}). Birkaç saniye sonra tekrar dene.`
  )
}

/**
 * Google Gemini (AI Studio) provider. Native JSON mode + own free quota →
 * reliable where the shared OpenRouter free pool is rate-limited.
 */
const callGemini = async (
  system: string,
  input: GenerateInput
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY!
  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL

  const parts: Array<Record<string, unknown>> = [{ text: USER_INSTRUCTION }]
  for (const img of input.images.slice(0, MAX_IMAGES)) {
    parts.push({ inline_data: { mime_type: img.mime, data: img.data } })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Gemini hatası (${res.status}): ${text.slice(0, 200)}`
    )
  }

  const json: any = await res.json()
  const content = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text)
    .filter(Boolean)
    .join("")
  if (!content) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Gemini boş yanıt döndürdü"
    )
  }
  return content
}

/**
 * Picks the provider. Prefer Gemini (own quota) when configured, falling back
 * to OpenRouter on failure. Either key alone is enough to run.
 */
const callProvider = async (input: GenerateInput): Promise<string> => {
  const system = buildSystemPrompt(input)
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY

  if (!hasGemini && !hasOpenRouter) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "AI sağlayıcı yok: helm/.env içine GEMINI_API_KEY veya OPENROUTER_API_KEY ekle."
    )
  }

  if (hasGemini) {
    try {
      return await callGemini(system, input)
    } catch (e) {
      if (!hasOpenRouter) {
        throw e
      }
      // Gemini failed but OpenRouter is available → degrade to it.
    }
  }

  return callOpenRouter(system, buildUserContent(input))
}

/**
 * Text-only generation for the prompt library (no images). Runs system +
 * filled-template through the same model chain. Returns raw model text.
 */
export const generateText = async (
  system: string,
  userText: string
): Promise<string> => callOpenRouter(system, userText)

/* ── Image analysis (vision → sector + brand hints) ─────────────────────── */

export interface AnalyzeResult {
  /** mobile-game | mobile-app | saas-web | furniture | other */
  sector: string
  /** short Turkish one-liner: what's in the image */
  summary: string
  /** detected brand-variable values to pre-fill prompts, e.g. GAME_NAME */
  fields: Record<string, string>
}

const VALID_SECTORS = [
  "mobile-game",
  "mobile-app",
  "saas-web",
  "furniture",
  "other",
]

const ANALYZE_SYSTEM = [
  "Sen bir ürün/medya analistisin. Verilen görseli incele ve SADECE geçerli JSON döndür (markdown yok).",
  "Şema:",
  `{
  "sector": "mobile-game | mobile-app | saas-web | furniture | other",
  "summary": "Türkçe tek cümle: görselde ne var",
  "fields": { "MARKA_DEGISKENI": "tahmini değer" }
}`,
  "Sektör: mobile-game (mobil oyun ekranı/sanatı), mobile-app (mobil uygulama UI), saas-web (web/dashboard ürün UI), furniture (mobilya/fiziksel ürün fotoğrafı), other.",
  "fields: sektöre uygun marka değişkenlerini doldur — oyun: GAME_NAME, GAME_GENRE, GAME_ART_STYLE, GAME_MOOD; uygulama: APP_NAME, APP_CATEGORY; saas: SAAS_NAME, SAAS_CATEGORY; mobilya: PRODUCT_NAME, PRODUCT_CATEGORY, COLOR. Emin olmadığın alanı ATLA, uydurma.",
].join("\n")

const validateAnalyze = (data: any): AnalyzeResult => {
  const sector = VALID_SECTORS.includes(data?.sector) ? data.sector : "other"
  const fields: Record<string, string> = {}
  if (data?.fields && typeof data.fields === "object") {
    for (const [k, v] of Object.entries(data.fields)) {
      if (typeof v === "string" && v.trim()) {
        fields[k] = v
      }
    }
  }
  return { sector, summary: String(data?.summary ?? ""), fields }
}

/** Direct Google Gemini JSON call with an image (bypasses OpenRouter). */
const callGeminiJson = async (
  system: string,
  userText: string,
  image: GenerateImage
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY!
  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: userText },
            { inline_data: { mime_type: image.mime, data: image.data } },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1200, responseMimeType: "application/json" },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Gemini hatası (${res.status}): ${text.slice(0, 200)}`
    )
  }
  const json: any = await res.json()
  const content = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text)
    .filter(Boolean)
    .join("")
  if (!content) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Gemini boş yanıt")
  }
  return content
}

/** Vision-analyze an image → sector + brand hints. Gemini-direct first. */
export const analyzeImage = async (
  image: GenerateImage
): Promise<AnalyzeResult> => {
  const userText = "Bu görseli analiz et. Yalnızca JSON döndür."
  if (process.env.GEMINI_API_KEY) {
    try {
      return validateAnalyze(parseJson(await callGeminiJson(ANALYZE_SYSTEM, userText, image)))
    } catch (e) {
      if (!process.env.OPENROUTER_API_KEY) throw e
    }
  }
  const userContent = [
    { type: "text", text: userText },
    {
      type: "image_url",
      image_url: { url: `data:${image.mime};base64,${image.data}` },
    },
  ]
  return validateAnalyze(parseJson(await callOpenRouter(ANALYZE_SYSTEM, userContent)))
}

const IMAGE_MODEL = "google/gemini-2.5-flash-image"

/**
 * Image editing: input image + instruction → a new edited image (data URL).
 * Uses a Gemini image model via OpenRouter BYOK (own Google quota → cheap).
 * Returns the model's image as a `data:image/...;base64,...` URL.
 */
const GEMINI_IMAGE_DEFAULT = "gemini-2.5-flash-image"

/**
 * DIRECT Google Gemini image generation/edit (own quota, BYPASSES OpenRouter →
 * no OpenRouter 402/credit gate). Used first when GEMINI_API_KEY is set.
 */
const callGeminiImage = async (
  prompt: string,
  image?: GenerateImage
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY!
  const model = process.env.GEMINI_IMAGE_MODEL || GEMINI_IMAGE_DEFAULT
  const parts: Array<Record<string, unknown>> = [{ text: prompt }]
  if (image) {
    parts.push({ inline_data: { mime_type: image.mime, data: image.data } })
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Gemini görsel hatası (${res.status}): ${text.slice(0, 200)}`
    )
  }
  const json: any = await res.json()
  const part = (json?.candidates?.[0]?.content?.parts ?? []).find(
    (p: any) => p?.inlineData?.data || p?.inline_data?.data
  )
  const inline = part?.inlineData ?? part?.inline_data
  if (!inline?.data) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Gemini görsel döndürmedi (yoğunluk olabilir, tekrar dene)"
    )
  }
  const mime = inline.mimeType ?? inline.mime_type ?? "image/png"
  return `data:${mime};base64,${inline.data}`
}

/** OpenRouter image path (fallback when no Gemini key). */
const openRouterImage = async (
  prompt: string,
  image?: GenerateImage
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Görsel için anahtar yok: helm/.env içine GEMINI_API_KEY (önerilir) veya OPENROUTER_API_KEY ekle."
    )
  }
  const model = process.env.OPENROUTER_IMAGE_MODEL || IMAGE_MODEL
  const content = image
    ? [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: { url: `data:${image.mime};base64,${image.data}` },
        },
      ]
    : prompt
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://wesan.co",
      "X-Title": "Wesan Content Studio",
    },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      messages: [{ role: "user", content }],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Görsel üretilemedi (${res.status}): ${text.slice(0, 200)}`
    )
  }
  const json: any = await res.json()
  const url = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (typeof url !== "string" || !url.startsWith("data:")) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Model görsel döndürmedi (yoğunluk olabilir, tekrar dene)"
    )
  }
  return url
}

/**
 * Shared quality + subject-preservation directive prepended to EVERY edit. The
 * image models (Gemini 2.5 Flash Image / OpenRouter) follow explicit English
 * instructions well; without this, terse one-line presets drift — the subject
 * gets redrawn, text mangled, or artifacts introduced. One source so all edit
 * paths (presets, pack compose, free prompt) share the same baseline.
 */
const EDIT_DIRECTIVE = [
  "You are a professional product-photo retoucher.",
  "Apply ONLY the edit described below to the PROVIDED image — nothing else.",
  "Preserve the main subject exactly: its identity, shape, proportions, colors, materials, and any legible text or logos. Do not redraw, warp, add, or remove the subject.",
  "Deliver a photorealistic, high-resolution result: sharp focus, clean edges, natural lighting and shadows, no banding or compression artifacts.",
  "Do not add any watermark, signature, caption, border, or extra text unless the edit explicitly asks for it.",
  "Edit to apply:",
].join(" ")

/** Wrap a raw edit instruction with the shared preservation/quality directive. */
const withEditDirective = (prompt: string): string =>
  `${EDIT_DIRECTIVE}\n\n${prompt}`

/** Image editing: input image + instruction → new image. Gemini-direct first. */
export const editImage = async (
  image: GenerateImage,
  prompt: string
): Promise<string> => {
  const full = withEditDirective(prompt)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGeminiImage(full, image)
    } catch (e) {
      if (!process.env.OPENROUTER_API_KEY) throw e
    }
  }
  return openRouterImage(full, image)
}

/** Text-to-image (no reference) → data URL. Gemini-direct first. */
export const generateImage = async (prompt: string): Promise<string> => {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGeminiImage(prompt)
    } catch (e) {
      if (!process.env.OPENROUTER_API_KEY) throw e
    }
  }
  return openRouterImage(prompt)
}

/**
 * Orchestrates: prompt → vision LLM → parse → validate.
 * Time: dominated by the network call to the model. Space: O(payload).
 */
export const generateContent = async (
  input: GenerateInput
): Promise<GenerationResult> => {
  if (!input.images?.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "En az 1 görsel gerekli")
  }
  if (!input.targets?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "En az 1 hedef (platform + format) seçilmeli"
    )
  }

  const raw = await callProvider(input)
  const parsed = parseJson(raw)
  const { brief, variants } = validate(parsed, input.targets)

  return { id: randomUUID(), brief, variants }
}
