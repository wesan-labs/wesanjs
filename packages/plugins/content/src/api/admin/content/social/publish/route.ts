import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProvider,
  SocialProviderError,
} from "../../../../../lib/social"

interface PublishBody {
  content?: string
  targets?: { platform: string; accountId: string }[]
  mediaUrls?: string[]
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
  const { content, targets, mediaUrls, isDraft, scheduledFor, timezone } =
    (req.body as PublishBody) ?? {}

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

  const provider = getSocialProvider()
  if (!provider.isConfigured()) {
    res
      .status(400)
      .json({ error: "ZERNIO_API_KEY tanımlı değil — önce key ekleyin." })
    return
  }
  try {
    const result = await provider.publish({
      content,
      targets,
      mediaUrls,
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
