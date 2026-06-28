import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProvider,
  SocialProviderError,
} from "../../../../../lib/social"

/**
 * GET /admin/content/social/analytics?accountId=…
 * Per-account insights (overview aggregates + per-post metrics) from the provider.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const accountId = (req.query.accountId as string) || ""
  if (!accountId) {
    res.status(400).json({ error: "accountId gerekli." })
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
    const analytics = await provider.getAnalytics(accountId)
    res.json({ analytics })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({ error: err.message })
  }
}
