import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProviderForRequest,
  SocialProviderError,
} from "../../../../../lib/social"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const accountId = (req.query.accountId as string) || ""
  if (!accountId) {
    res.status(400).json({ error: "accountId gerekli." })
    return
  }
  const provider = await getSocialProviderForRequest(req, req.scope)
  if (!provider.isConfigured()) {
    res.status(400).json({
      error: "Sosyal analitik yapılandırılmamış.",
    })
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
