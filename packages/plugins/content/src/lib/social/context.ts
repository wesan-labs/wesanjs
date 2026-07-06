import type { MedusaContainer } from "@medusajs/framework/types"
import { decryptSecret } from "../crypto"
import { CONTENT_CONNECTION_MODULE } from "../../modules/content-connection"
import { ensureZernioProfile } from "./provision"

export type SocialRuntimeContext = {
  apiKey: string
  profileId: string
}

export const platformZernioApiKey = (): string | null => {
  const v = process.env.ZERNIO_API_KEY || process.env.LATE_API_KEY || ""
  if (!v || v.includes("placeholder")) {
    return null
  }
  return v
}

/** Platform key (Model A) or tenant BYOK secret from content_connection. */
export const resolveApiKeyForTenant = async (
  container: MedusaContainer,
  tenantId: string
): Promise<string | null> => {
  const platform = platformZernioApiKey()
  const connService = container.resolve(CONTENT_CONNECTION_MODULE) as {
    listContentConnections: (
      f: object
    ) => Promise<{ secret_enc?: string | null }[]>
  }
  const [row] = await connService.listContentConnections({
    tenant_id: tenantId,
    provider: "zernio",
  })
  if (row?.secret_enc) {
    try {
      const parsed = JSON.parse(decryptSecret(row.secret_enc) || "{}") as {
        api_key?: string
      }
      if (parsed.api_key?.trim()) {
        return parsed.api_key.trim()
      }
    } catch {
      /* fall through to platform */
    }
  }
  return platform
}

/**
 * Tenant-scoped Zernio profile (Model A). Lazy-provisions on first social call.
 * Without tenant_id (legacy dev), uses the platform default profile.
 */
export const resolveSocialContext = async (
  container: MedusaContainer,
  tenantId?: string | null
): Promise<SocialRuntimeContext | null> => {
  const apiKey = tenantId
    ? await resolveApiKeyForTenant(container, tenantId)
    : platformZernioApiKey()
  if (!apiKey) {
    return null
  }

  if (!tenantId) {
    const profileId = await fetchDefaultProfileId(apiKey)
    return profileId ? { apiKey, profileId } : null
  }

  const profileId = await ensureZernioProfile(container, tenantId, apiKey)
  return profileId ? { apiKey, profileId } : null
}

async function fetchDefaultProfileId(apiKey: string): Promise<string | null> {
  const base = process.env.SOCIAL_API_BASE || "https://zernio.com/api/v1"
  const res = await fetch(`${base}/profiles`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    return null
  }
  const data = (await res.json()) as {
    profiles?: { _id: string; isDefault?: boolean }[]
  }
  const list = data.profiles || []
  const p = list.find((x) => x.isDefault) || list[0]
  return p?._id ?? null
}
