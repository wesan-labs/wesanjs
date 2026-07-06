import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { platformZernioApiKey } from "../lib/social/context"
import { ensureZernioProfile } from "../lib/social/provision"

export const TENANT_CREATED_EVENT = "tenant.created"

type TenantCreatedPayload = {
  id: string
  name?: string
  slug?: string
}

/** Provision a Zernio profile when a new org is created (Model A). */
export default async function tenantCreatedSocialHandler({
  event: { data },
  container,
}: SubscriberArgs<TenantCreatedPayload>) {
  const apiKey = platformZernioApiKey()
  if (!apiKey || !data?.id) {
    return
  }
  try {
    await ensureZernioProfile(container, data.id, apiKey)
  } catch (e) {
    const logger = container.resolve("logger") as {
      warn: (m: string) => void
    }
    const msg = e instanceof Error ? e.message : String(e)
    logger.warn(`[social] tenant.created provision failed for ${data.id}: ${msg}`)
  }
}

export const config: SubscriberConfig = {
  event: TENANT_CREATED_EVENT,
}
