import type { MedusaContainer } from "@medusajs/framework/types"
import { CONTENT_CONNECTION_MODULE } from "../../modules/content-connection"

const TENANT_MODULE = "tenant"
const BASE = process.env.SOCIAL_API_BASE || "https://zernio.com/api/v1"

async function fetchDefaultProfileId(apiKey: string): Promise<string | null> {
  const res = await fetch(`${BASE}/profiles`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    profiles?: { _id: string; isDefault?: boolean }[]
  }
  const list = data.profiles || []
  const p = list.find((x) => x.isDefault) || list[0]
  return p?._id ?? null
}

type ConnectionRow = {
  id: string
  tenant_id: string
  provider: string
  config?: { zernio_profile_id?: string; zernio_profile_name?: string } | null
}

/**
 * Ensure this tenant has a dedicated Zernio profile (Model A — one platform key,
 * many profiles). Idempotent: reuses stored profile id or creates via API.
 */
export async function ensureZernioProfile(
  container: MedusaContainer,
  tenantId: string,
  apiKey: string
): Promise<string | null> {
  const connService = container.resolve(CONTENT_CONNECTION_MODULE) as {
    listContentConnections: (f: object) => Promise<ConnectionRow[]>
    createContentConnections: (d: object) => Promise<ConnectionRow>
    updateContentConnections: (d: object) => Promise<ConnectionRow>
  }

  const [existing] = await connService.listContentConnections({
    tenant_id: tenantId,
    provider: "zernio",
  })
  const storedId = existing?.config?.zernio_profile_id
  if (storedId) {
    return storedId
  }

  let tenantName = tenantId
  let tenantSlug = tenantId
  try {
    const tenantService = container.resolve(TENANT_MODULE) as {
      listTenants: (f: object) => Promise<{ id: string; name: string; slug: string }[]>
    }
    const [tenant] = await tenantService.listTenants({ id: tenantId })
    if (tenant) {
      tenantName = tenant.name
      tenantSlug = tenant.slug
    }
  } catch {
    /* tenant module optional in tests */
  }

  const profileName = `${tenantName} (${tenantSlug})`
  const res = await fetch(`${BASE}/profiles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: profileName,
      description: `Levios tenant ${tenantId}`,
    }),
  })
  const body = (await res.json()) as {
    profile?: { _id: string }
    error?: string
    message?: string
  }
  if (!res.ok || !body.profile?._id) {
    const logger = container.resolve("logger") as {
      warn: (m: string) => void
    }
    logger.warn(
      `[social] Zernio profile create failed for ${tenantId}: ${
        body.error || body.message || res.status
      }`
    )
    // Reuse platform default profile when billing blocks new profiles (free tier).
    const fallback = await fetchDefaultProfileId(apiKey)
    if (fallback) {
      const config = {
        zernio_profile_id: fallback,
        zernio_profile_name: profileName,
        zernio_profile_shared: true,
      }
      if (existing) {
        await connService.updateContentConnections({ id: existing.id, config })
      } else {
        await connService.createContentConnections({
          tenant_id: tenantId,
          provider: "zernio",
          category: "social",
          config,
        })
      }
      return fallback
    }
    return null
  }

  const config = {
    zernio_profile_id: body.profile._id,
    zernio_profile_name: profileName,
  }

  if (existing) {
    await connService.updateContentConnections({
      id: existing.id,
      config,
    })
  } else {
    await connService.createContentConnections({
      tenant_id: tenantId,
      provider: "zernio",
      category: "social",
      config,
    })
  }

  return body.profile._id
}
