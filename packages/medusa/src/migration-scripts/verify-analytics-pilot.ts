#!/usr/bin/env node

/**
 * Migration Script: Verify analytics builtin pipeline (#0010).
 *
 * Bootstrap → ingest → sync → snapshot assert + tenant isolation on events.
 * Requires seed-isolation-pilot (Acme Game app under tenant_acme).
 */

import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import { runAnalyticsSync } from "@medusajs/analytics"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  Modules,
} from "@medusajs/framework/utils"

const TENANT_MODULE = "tenant"
const REVENUE_MODULE = "revenue"

const ACME_APP_NAME = "Acme Game"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`VERIFY FAILED: ${message}`)
  }
}

async function resolveTenantId(
  tenantService: {
    listTenants: (f: object) => Promise<{ id: string }[]>
  },
  slug: string
) {
  const [tenant] = await tenantService.listTenants({ slug })
  assert(!!tenant, `Tenant slug ${slug} not found — run seed-isolation-pilot`)
  return tenant.id
}

export default async function verifyAnalyticsPilot({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!MedusaModule.isInstalled(Modules.ANALYTICS)) {
    logger.info("Analytics module not installed — skipping")
    return
  }

  logger.info("Running analytics pilot verification (#0010)...")

  const tenantService = container.resolve(TENANT_MODULE) as {
    listTenants: (f: object) => Promise<{ id: string }[]>
  }
  const revenue = container.resolve(REVENUE_MODULE) as {
    listApps: (
      f: object,
      o?: object
    ) => Promise<{ id: string; name: string; tenant_id?: string }[]>
  }
  const analytics = container.resolve(Modules.ANALYTICS) as unknown as {
    rotateBootstrapToken: (
      tenantId: string | undefined,
      productId: string
    ) => Promise<{ token: string }>
    resolveBootstrapConfig: (
      rawToken: string
    ) => Promise<{ valid: boolean; product_id?: string; tenant_id?: string }>
    recordIngestEvent: (input: {
      tenant_id?: string | null
      product_id: string
      event: string
      distinct_id: string
      occurred_at?: Date
    }) => Promise<void>
    listEventsForDay: (
      tenantId: string | undefined,
      productId: string,
      day: Date
    ) => Promise<{ event: string; distinct_id: string }[]>
    listSnapshotsForProduct: (
      tenantId: string | undefined,
      productId: string,
      days?: number
    ) => Promise<{ metric: string; value: number }[]>
    recordDayMetrics: (
      tenantId: string | undefined,
      productId: string,
      day: Date,
      metrics: Array<{
        source: string
        metric: string
        value: number
      }>
    ) => Promise<void>
  }

  const acmeId = await resolveTenantId(tenantService, "acme")
  const betaId = await resolveTenantId(tenantService, "beta")

  const acmeApps = await revenue.listApps({ tenant_id: acmeId }, { take: 50 })
  const acmeApp = acmeApps.find((a) => a.name === ACME_APP_NAME)
  assert(!!acmeApp, `${ACME_APP_NAME} missing — run seed-isolation-pilot`)

  const { token } = await analytics.rotateBootstrapToken(acmeId, acmeApp!.id)
  const bootstrap = await analytics.resolveBootstrapConfig(token)
  assert(bootstrap.valid, "Bootstrap token should resolve")
  assert(
    bootstrap.product_id === acmeApp!.id,
    "Bootstrap product_id mismatch"
  )
  assert(bootstrap.tenant_id === acmeId, "Bootstrap tenant_id mismatch")

  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)

  await analytics.recordIngestEvent({
    tenant_id: acmeId,
    product_id: acmeApp!.id,
    event: "funnel_step_open",
    distinct_id: "verify-user-1",
    occurred_at: today,
  })
  await analytics.recordIngestEvent({
    tenant_id: acmeId,
    product_id: acmeApp!.id,
    event: "funnel_step_play",
    distinct_id: "verify-user-2",
    occurred_at: today,
  })

  const syncResult = await runAnalyticsSync(
    {
      listProducts: async (tenantId) => {
        const filter = tenantId ? { tenant_id: tenantId } : {}
        const apps = await revenue.listApps(filter, { take: 500 })
        return apps.map((app) => ({
          id: app.id,
          tenant_id: app.tenant_id,
          vertical: "mobile_game",
          name: app.name,
        }))
      },
      listEventsForDay: (tenantId, productId, day) =>
        analytics.listEventsForDay(tenantId, productId, day),
      recordDayMetrics: (tenantId, productId, day, metrics) =>
        analytics.recordDayMetrics(tenantId, productId, day, metrics),
      log: logger,
    },
    { tenantId: acmeId, days: 1 }
  )

  assert(
    syncResult.metrics_written > 0,
    "Sync should write metrics from ingested events (no seed fallback)"
  )

  const acmeEvents = await analytics.listEventsForDay(
    acmeId,
    acmeApp!.id,
    today
  )
  assert(acmeEvents.length >= 2, "Acme should see ingested events")

  const betaEventsOnAcmeProduct = await analytics.listEventsForDay(
    betaId,
    acmeApp!.id,
    today
  )
  assert(
    betaEventsOnAcmeProduct.length === 0,
    "Beta tenant must not see Acme events on shared product id scope"
  )

  const snapshots = await analytics.listSnapshotsForProduct(
    acmeId,
    acmeApp!.id,
    1
  )
  const dau = snapshots.find((s) => s.metric === "dau")
  assert(!!dau && dau.value > 0, "DAU snapshot should exist after sync")

  logger.info(
    `Analytics pilot OK — ${syncResult.metrics_written} metrics, DAU=${dau?.value}`
  )
}

defineFileConfig({
  isDisabled: () => false,
})
