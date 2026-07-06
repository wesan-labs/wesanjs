#!/usr/bin/env node

/**
 * Migration Script: Provision a Zernio profile per tenant (Model A).
 * Idempotent — skips tenants that already have content_connection.zernio profile.
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const TENANT_MODULE = "tenant"

export default async function provisionTenantSocialProfiles({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  let platformZernioApiKey: () => string | null
  let ensureZernioProfile: (
    c: typeof container,
    tenantId: string,
    apiKey: string
  ) => Promise<string | null>

  try {
    const ctx = await import(
      // @ts-expect-error runtime import from file-linked content plugin
      "@medusajs/content-plugin/.medusa/server/src/lib/social/context.js"
    )
    const prov = await import(
      // @ts-expect-error runtime import from file-linked content plugin
      "@medusajs/content-plugin/.medusa/server/src/lib/social/provision.js"
    )
    platformZernioApiKey = ctx.platformZernioApiKey
    ensureZernioProfile = prov.ensureZernioProfile
  } catch {
    logger.info(
      "provision-tenant-social-profiles: content plugin not available — skip."
    )
    return
  }

  const apiKey = platformZernioApiKey()
  if (!apiKey) {
    logger.info(
      "provision-tenant-social-profiles: ZERNIO_API_KEY missing — skip."
    )
    return
  }

  const tenantService = container.resolve(TENANT_MODULE) as {
    listTenants: (f: object, c?: object) => Promise<{ id: string; slug: string }[]>
  }
  const tenants = await tenantService.listTenants({}, { take: 500 })
  let created = 0

  for (const t of tenants) {
    const profileId = await ensureZernioProfile(container, t.id, apiKey)
    if (profileId) {
      created++
      logger.info(`provision-tenant-social: ${t.slug} → profile ${profileId}`)
    }
  }

  logger.info(
    `provision-tenant-social-profiles done — ${created}/${tenants.length} tenant(s).`
  )
}
