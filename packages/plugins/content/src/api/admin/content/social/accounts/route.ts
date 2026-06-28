import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProvider,
  SocialProviderError,
} from "../../../../../lib/social"
import { isImageHostConfigured } from "../../../../../lib/social/image-host"

/**
 * GET /admin/content/social/accounts
 * Connected social accounts, live from the provider (Late/Zernio). Returns
 * `configured: false` (200) when no API key is set so the UI can prompt setup.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const provider = getSocialProvider()
  const imageHost = isImageHostConfigured()
  if (!provider.isConfigured()) {
    res.json({ accounts: [], configured: false, imageHost })
    return
  }
  try {
    const accounts = await provider.listAccounts()
    res.json({ accounts, configured: true, imageHost })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({ error: err.message })
  }
}
