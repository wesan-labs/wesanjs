#!/usr/bin/env node

/**
 * Migration Script: Isolation pilot orgs + sample data (#0009).
 *
 * Creates Acme/Beta tenants, pilot user, and scoped records across
 * revenue, content, and cms. Idempotent — safe to re-run.
 */

import { createUserAccountWorkflow } from "@medusajs/core-flows"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  Modules,
} from "@medusajs/framework/utils"

const TENANT_MODULE = "tenant"
const REVENUE_MODULE = "revenue"
const CMS_MODULE = "cms"
const CONTENT_LIBRARY_MODULE = "contentLibrary"

const PILOT_EMAIL = "pilot@helm.local"
const PILOT_PASSWORD = "pilotsecret123"
const SUPER_ADMIN_ROLE_ID = "role_super_admin"

const ORGS = [
  { id: "tenant_acme", slug: "acme", name: "Acme" },
  { id: "tenant_beta", slug: "beta", name: "Beta" },
] as const

type OrgSeed = {
  tenantId: string
  revenueApp: string
  expenseLabel: string
  contentTitle: string
  cmsSlug: string
  cmsName: string
}

const ORG_DATA: Record<(typeof ORGS)[number]["slug"], Omit<OrgSeed, "tenantId">> =
  {
    acme: {
      revenueApp: "Acme Game",
      expenseLabel: "Acme infra cost",
      contentTitle: "Acme pilot content",
      cmsSlug: "acme-web",
      cmsName: "Acme Site",
    },
    beta: {
      revenueApp: "Beta App",
      expenseLabel: "Beta ads spend",
      contentTitle: "Beta pilot content",
      cmsSlug: "beta-web",
      cmsName: "Beta Site",
    },
  }

async function ensureTenant(
  tenantService: {
    listTenants: (f: object) => Promise<{ id: string; slug: string }[]>
    createTenants: (d: object) => Promise<{ id: string }>
  },
  spec: (typeof ORGS)[number]
) {
  const [bySlug] = await tenantService.listTenants({ slug: spec.slug })
  if (bySlug) {
    return bySlug.id
  }

  try {
    const created = await tenantService.createTenants({
      id: spec.id,
      slug: spec.slug,
      name: spec.name,
      status: "active",
    })
    return created.id
  } catch {
    const [retry] = await tenantService.listTenants({ slug: spec.slug })
    if (!retry) {
      throw new Error(`Failed to create or resolve tenant ${spec.slug}`)
    }
    return retry.id
  }
}

async function ensureMembership(
  tenantService: {
    listTenantMemberships: (f: object) => Promise<{ id: string }[]>
    createTenantMemberships: (d: object) => Promise<unknown>
  },
  tenantId: string,
  userId: string
) {
  const [existing] = await tenantService.listTenantMemberships({
    tenant_id: tenantId,
    user_id: userId,
  })
  if (existing) {
    return
  }
  await tenantService.createTenantMemberships({
    tenant_id: tenantId,
    user_id: userId,
    role: "admin",
  })
}

async function ensurePilotUser(container: ExecArgs["container"]) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const [existingUser] = await userModule.listUsers({ email: PILOT_EMAIL })
  let user = existingUser

  if (!user) {
    const registerResult = await authModule.register("emailpass", {
      body: { email: PILOT_EMAIL, password: PILOT_PASSWORD },
    })

    if (!registerResult.success || !registerResult.authIdentity) {
      throw new Error(
        registerResult.error ?? "Failed to register isolation pilot user"
      )
    }

    const { result: createdUser } = await createUserAccountWorkflow(
      container
    ).run({
      input: {
        authIdentityId: registerResult.authIdentity.id,
        userData: {
          email: PILOT_EMAIL,
          first_name: "Isolation",
          last_name: "Pilot",
        },
      },
    })
    user = createdUser
    logger.info(`Created pilot user ${user.id}`)
  }

  if (MedusaModule.isInstalled(Modules.RBAC)) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: roleLinks } = await query.graph({
      entity: "user_rbac_role",
      fields: ["rbac_role_id"],
      filters: { user_id: user.id },
    })
    const linked = roleLinks.map(
      (entry: { rbac_role_id: string }) => entry.rbac_role_id
    )
    if (!linked.includes(SUPER_ADMIN_ROLE_ID)) {
      await link.create({
        [Modules.USER]: { user_id: user.id },
        [Modules.RBAC]: { rbac_role_id: SUPER_ADMIN_ROLE_ID },
      })
      logger.info("Assigned super admin role to pilot user")
    }
  }

  return user
}

async function seedOrgData(
  container: ExecArgs["container"],
  seed: OrgSeed,
  logger: { info: (msg: string) => void }
) {
  const revenue = container.resolve(REVENUE_MODULE) as {
    listApps: (
      f: object,
      o?: object
    ) => Promise<{ id: string; name: string }[]>
    createApps: (d: object) => Promise<{ id: string }>
    listExpenses: (f: object, o?: object) => Promise<{ id: string }[]>
    createExpenses: (d: object) => Promise<unknown>
    listMetricSnapshots: (f: object, o?: object) => Promise<{ id: string }[]>
    recordSnapshot: (d: {
      date: Date
      appId: string | null
      platform: string
      sourceType: string
      fields: Record<string, unknown>
      tenantId?: string | null
    }) => Promise<void>
  }

  let appId: string
  const [existingApp] = await revenue.listApps(
    { tenant_id: seed.tenantId, name: seed.revenueApp },
    { take: 1 }
  )
  if (!existingApp) {
    const created = await revenue.createApps({
      name: seed.revenueApp,
      tenant_id: seed.tenantId,
      status: "active",
      metadata: { isolation_pilot: true },
    })
    appId = created.id
    logger.info(`  revenue app: ${seed.revenueApp}`)
  } else {
    appId = existingApp.id
  }

  const [existingAdSnap] = await revenue.listMetricSnapshots(
    { tenant_id: seed.tenantId, source_type: "admob", app_id: appId },
    { take: 1 }
  )
  if (!existingAdSnap) {
    const today = new Date()
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - offset
        )
      )
      await revenue.recordSnapshot({
        date: day,
        appId,
        platform: offset % 2 === 0 ? "ios" : "android",
        sourceType: "admob",
        tenantId: seed.tenantId,
        fields: {
          ad_revenue: offset === 0 ? 18.4 : 4.2 + offset,
          ad_impressions: 800 + offset * 120,
          currency: "USD",
        },
      })
    }
    logger.info(`  admob snapshots: 7 days for ${seed.revenueApp}`)
  }

  const [existingRcSnap] = await revenue.listMetricSnapshots(
    {
      tenant_id: seed.tenantId,
      source_type: "revenuecat",
      app_id: appId,
      platform: "all",
    },
    { take: 1 }
  )
  if (!existingRcSnap) {
    const today = new Date()
    const day = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )
    await revenue.recordSnapshot({
      date: day,
      appId,
      platform: "all",
      sourceType: "revenuecat",
      tenantId: seed.tenantId,
      fields: {
        gross_revenue: seed.tenantId.includes("acme") ? 49.97 : 24.99,
        mrr: seed.tenantId.includes("acme") ? 19.99 : 9.99,
        active_subscriptions: seed.tenantId.includes("acme") ? 12 : 6,
        active_trials: 2,
        new_customers: 3,
        active_users: 40,
        currency: "USD",
      },
    })
    logger.info(`  revenuecat snapshot for ${seed.revenueApp}`)
  }

  const expenses = (await revenue.listExpenses(
    { tenant_id: seed.tenantId },
    { take: 50 }
  )) as { description?: string }[]
  if (!expenses.some((e) => e.description === seed.expenseLabel)) {
    await revenue.createExpenses({
      tenant_id: seed.tenantId,
      description: seed.expenseLabel,
      amount: seed.tenantId.includes("acme") ? 120 : 85,
      currency: "USD",
      occurred_at: new Date(),
      category: "infra",
    })
    logger.info(`  expense: ${seed.expenseLabel}`)
  }

  if (MedusaModule.isInstalled(CONTENT_LIBRARY_MODULE)) {
    const content = container.resolve(CONTENT_LIBRARY_MODULE) as {
      listContentItems: (f: object, o?: object) => Promise<{ title?: string }[]>
      createContentItems: (d: object) => Promise<unknown>
    }
    const items = await content.listContentItems(
      { tenant_id: seed.tenantId },
      { take: 50 }
    )
    if (!items.some((item) => item.title === seed.contentTitle)) {
      await content.createContentItems({
        tenant_id: seed.tenantId,
        kind: "text",
        title: seed.contentTitle,
        value: `Isolation pilot content for ${seed.tenantId}`,
      })
      logger.info(`  content: ${seed.contentTitle}`)
    }
  }

  if (MedusaModule.isInstalled(CMS_MODULE)) {
    const cms = container.resolve(CMS_MODULE) as {
      listCmsSites: (f: object, o?: object) => Promise<{ slug: string }[]>
      createCmsSites: (d: object) => Promise<unknown>
    }
    const [site] = await cms.listCmsSites({ slug: seed.cmsSlug }, { take: 1 })
    if (!site) {
      await cms.createCmsSites({
        slug: seed.cmsSlug,
        name: seed.cmsName,
        tenant_id: seed.tenantId,
        base_url: `https://${seed.cmsSlug}.example.com`,
        enabled: true,
      })
      logger.info(`  cms site: ${seed.cmsName}`)
    }
  }
}

export default async function seedIsolationPilot({ container }: ExecArgs) {
  if (!MedusaModule.isInstalled(TENANT_MODULE)) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("Tenant module not installed. Skipping isolation pilot seed.")
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const tenantService = container.resolve(TENANT_MODULE) as {
    listTenants: (f: object) => Promise<{ id: string; slug: string }[]>
    createTenants: (d: object) => Promise<{ id: string }>
    listTenantMemberships: (f: object) => Promise<{ id: string }[]>
    createTenantMemberships: (d: object) => Promise<unknown>
  }
  const userModule = container.resolve(Modules.USER)

  logger.info("Seeding isolation pilot orgs (Acme + Beta)...")

  const tenantIds: Record<string, string> = {}
  for (const org of ORGS) {
    tenantIds[org.slug] = await ensureTenant(tenantService, org)
    logger.info(`Tenant ${org.name}: ${tenantIds[org.slug]}`)
  }

  const pilot = await ensurePilotUser(container)
  const [admin] = await userModule.listUsers({ email: "admin@helm.local" })
  const memberIds = [pilot.id, admin?.id].filter(Boolean) as string[]

  for (const org of ORGS) {
    for (const userId of memberIds) {
      await ensureMembership(tenantService, tenantIds[org.slug], userId)
    }
  }
  logger.info("Admin memberships ensured for pilot + admin users")

  for (const org of ORGS) {
    logger.info(`Seeding ${org.name} data...`)
    await seedOrgData(
      container,
      { tenantId: tenantIds[org.slug], ...ORG_DATA[org.slug] },
      logger
    )
  }

  logger.info(
    `Isolation pilot ready — login: ${PILOT_EMAIL} / ${PILOT_PASSWORD}`
  )
  logger.info(`Tenants: acme=${tenantIds.acme}, beta=${tenantIds.beta}`)
}

defineFileConfig({
  isDisabled: () => false,
})
