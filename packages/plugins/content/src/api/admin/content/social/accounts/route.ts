import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getSocialProvider,
  SocialProviderError,
} from "../../../../../lib/social"

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
  if (!provider.isConfigured()) {
    res.json({ accounts: [], configured: false })
    return
  }
  try {
    const accounts = await provider.listAccounts()
    res.json({ accounts, configured: true })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({ error: err.message })
  }
}
