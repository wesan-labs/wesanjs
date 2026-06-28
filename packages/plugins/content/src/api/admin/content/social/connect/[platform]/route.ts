import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProvider,
  SocialProviderError,
} from "../../../../../../lib/social"

/**
 * GET /admin/content/social/connect/:platform
 * Returns a hosted OAuth URL; the UI opens it so the user authorizes the account
 * on the platform. The provider stores the token and the account appears in
 * /accounts after authorization.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { platform } = req.params
  const provider = getSocialProvider()
  if (!provider.isConfigured()) {
    res
      .status(400)
      .json({ error: "ZERNIO_API_KEY tanımlı değil — önce key ekleyin." })
    return
  }
  try {
    const authUrl = await provider.connectUrl(platform)
    res.json({ authUrl })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({ error: err.message })
  }
}
