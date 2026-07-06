import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createLateProvider } from "./late"
import { resolveSocialContext } from "./context"
import type { SocialProvider } from "./types"

export * from "./types"
export { SocialProviderError } from "./late"
export { createLateProvider } from "./late"
export {
  platformZernioApiKey,
  resolveSocialContext,
} from "./context"

const noopProvider: SocialProvider = {
  name: "late",
  isConfigured: () => false,
  listAccounts: async () => [],
  connectUrl: async () => {
    throw new Error("Social provider not configured")
  },
  getAnalytics: async () => {
    throw new Error("Social provider not configured")
  },
  publish: async () => {
    throw new Error("Social provider not configured")
  },
}

/** @deprecated Use getSocialProviderForRequest — tenant-scoped. */
export const getSocialProvider = (): SocialProvider => noopProvider

export async function getSocialProviderForRequest(
  req: AuthenticatedMedusaRequest,
  container: MedusaContainer
): Promise<SocialProvider> {
  const tenantId = (req as { tenant_id?: string }).tenant_id
  const ctx = await resolveSocialContext(container, tenantId)
  if (!ctx) {
    return noopProvider
  }
  return createLateProvider(ctx)
}

export async function getSocialProviderForTenant(
  container: MedusaContainer,
  tenantId: string
): Promise<SocialProvider | null> {
  const ctx = await resolveSocialContext(container, tenantId)
  return ctx ? createLateProvider(ctx) : null
}
