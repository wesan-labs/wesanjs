import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProviderForRequest,
  platformZernioApiKey,
  SocialProviderError,
} from "../../../../../lib/social"
import { isImageHostConfigured } from "../../../../../lib/social/image-host"

/**
 * GET /admin/content/social/accounts
 * Connected accounts for the active org's Zernio profile (Model A).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const imageHost = isImageHostConfigured()
  const platformSocial = !!platformZernioApiKey()
  const provider = await getSocialProviderForRequest(req, req.scope)
  if (!provider.isConfigured()) {
    res.json({
      accounts: [],
      configured: false,
      imageHost,
      platformSocial,
    })
    return
  }
  try {
    const accounts = await provider.listAccounts()
    res.json({
      accounts,
      configured: true,
      imageHost,
      platformSocial,
    })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({ error: err.message })
  }
}
