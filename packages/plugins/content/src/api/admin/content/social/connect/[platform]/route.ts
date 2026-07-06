import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProviderForRequest,
  SocialProviderError,
} from "../../../../../../lib/social"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { platform } = req.params
  const provider = await getSocialProviderForRequest(req, req.scope)
  if (!provider.isConfigured()) {
    res.status(400).json({
      error:
        "Sosyal yayın platform tarafından yapılandırılmamış. Levios operatörüne başvurun.",
    })
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
