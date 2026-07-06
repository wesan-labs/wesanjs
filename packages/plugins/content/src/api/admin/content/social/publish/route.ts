import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProviderForRequest,
  SocialProviderError,
} from "../../../../../lib/social"
import {
  mediaRequiredError,
  targetsRequiringMedia,
} from "../../../../../lib/social/platform-rules"
import {
  isImageHostConfigured,
  uploadImage,
} from "../../../../../lib/social/image-host"

interface PublishBody {
  content?: string
  targets?: { platform: string; accountId: string }[]
  /** already-public URLs */
  mediaUrls?: string[]
  /** local data URLs (e.g. studio image) → hosted publicly here first */
  mediaDataUrls?: string[]
  isDraft?: boolean
  scheduledFor?: string
  timezone?: string
}

/**
 * POST /admin/content/social/publish
 * Publish (or schedule) content to one or more connected accounts via the provider.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<PublishBody>,
  res: MedusaResponse
) => {
  const {
    content,
    targets,
    mediaUrls,
    mediaDataUrls,
    isDraft,
    scheduledFor,
    timezone,
  } = (req.body as PublishBody) ?? {}

  if (!content || !content.trim()) {
    res.status(400).json({ error: "content (metin) gerekli." })
    return
  }
  if (!targets?.length) {
    res
      .status(400)
      .json({ error: "En az bir hedef hesap (targets) gerekli." })
    return
  }

  const provider = await getSocialProviderForRequest(req, req.scope)
  if (!provider.isConfigured()) {
    res.status(400).json({
      error:
        "Sosyal yayın yapılandırılmamış. Organizasyon profili oluşturulamadı veya platform anahtarı eksik.",
    })
    return
  }

  // Host any local data-URL images publicly so the provider can fetch them.
  const finalMediaUrls = [...(mediaUrls ?? [])]
  if (mediaDataUrls?.length) {
    if (!isImageHostConfigured()) {
      res.status(400).json({
        error:
          "Görsel barındırma aktif değil (platform IMAGE_HOST). Public medya URL'i girin.",
      })
      return
    }
    try {
      for (const dataUrl of mediaDataUrls) {
        finalMediaUrls.push(await uploadImage(dataUrl))
      }
    } catch (e) {
      res.status(502).json({ error: `Görsel yüklenemedi: ${(e as Error).message}` })
      return
    }
  }

  const mediaPlatforms = targetsRequiringMedia(targets)
  if (mediaPlatforms.length && !finalMediaUrls.length) {
    res.status(400).json({ error: mediaRequiredError(mediaPlatforms) })
    return
  }

  try {
    const result = await provider.publish({
      content,
      targets,
      mediaUrls: finalMediaUrls,
      isDraft,
      scheduledFor,
      timezone,
    })
    res.json({ result })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({ error: err.message })
  }
}
