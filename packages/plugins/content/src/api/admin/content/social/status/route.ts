import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTENT_CONNECTION_MODULE } from "../../../../../modules/content-connection"
import {
  createLateProvider,
  platformZernioApiKey,
  resolveSocialContext,
  SocialProviderError,
} from "../../../../../lib/social"
import { isImageHostConfigured } from "../../../../../lib/social/image-host"

type ConnectionConfig = {
  zernio_profile_id?: string
  zernio_profile_name?: string
  zernio_profile_shared?: boolean
}

/**
 * GET /admin/content/social/status
 * Org-level social setup for Connections (Model A — platform key, tenant profile).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const tenantId = (req as { tenant_id?: string }).tenant_id
  if (!tenantId) {
    res.status(400).json({ error: "x-tenant-id gerekli." })
    return
  }

  const platformSocial = !!platformZernioApiKey()
  const imageHost = isImageHostConfigured()

  let profile: {
    id: string
    name: string | null
    shared: boolean
  } | null = null

  try {
    const connService = req.scope.resolve(CONTENT_CONNECTION_MODULE) as {
      listContentConnections: (
        f: object
      ) => Promise<{ config?: ConnectionConfig | null }[]>
    }
    const [row] = await connService.listContentConnections({
      tenant_id: tenantId,
      provider: "zernio",
    })
    const cfg = row?.config
    if (cfg?.zernio_profile_id) {
      profile = {
        id: cfg.zernio_profile_id,
        name: cfg.zernio_profile_name ?? null,
        shared: !!cfg.zernio_profile_shared,
      }
    }
  } catch {
    /* module optional during bootstrap */
  }

  const ctx = await resolveSocialContext(req.scope, tenantId)
  if (ctx && !profile) {
    profile = { id: ctx.profileId, name: null, shared: false }
  }

  if (!platformSocial || !ctx) {
    res.json({
      configured: false,
      platformSocial,
      imageHost,
      profile,
      accounts: [],
      accountCount: 0,
    })
    return
  }

  const provider = createLateProvider(ctx)
  try {
    const accounts = await provider.listAccounts()
    res.json({
      configured: true,
      platformSocial,
      imageHost,
      profile: profile ?? {
        id: ctx.profileId,
        name: null,
        shared: false,
      },
      accounts: accounts.map((a) => ({
        platform: a.platform,
        username: a.username,
        displayName: a.displayName,
        enabled: a.enabled,
        status: a.status,
      })),
      accountCount: accounts.length,
    })
  } catch (e) {
    const err = e as SocialProviderError
    res.status(err.status ?? 502).json({
      error: err.message,
      configured: true,
      platformSocial,
      imageHost,
      profile,
      accounts: [],
      accountCount: 0,
    })
  }
}
