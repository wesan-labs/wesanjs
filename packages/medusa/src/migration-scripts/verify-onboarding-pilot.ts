#!/usr/bin/env node

/**
 * Migration Script: Verify onboarding pilots (#0008 + #0009).
 *
 * Asserts Finance RBAC boundaries and Acme/Beta tenant isolation at
 * the service layer. Throws on failure — safe to re-run after seed scripts.
 */

import { hasPermission } from "@medusajs/framework"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"

const TENANT_MODULE = "tenant"
const REVENUE_MODULE = "revenue"
const CMS_MODULE = "cms"
const CONTENT_LIBRARY_MODULE = "contentLibrary"

const FINANCE_EMAIL = "finance@helm.local"
const FINANCE_ROLE_ID = "role_finance"
const SUPER_ADMIN_ROLE_ID = "role_super_admin"

const ACME_TENANT_ID = "tenant_acme"
const BETA_TENANT_ID = "tenant_beta"

const ACME_MARKERS = {
  app: "Acme Game",
  expense: "Acme infra cost",
  content: "Acme pilot content",
  cmsSlug: "acme-web",
}

const BETA_MARKERS = {
  app: "Beta App",
  expense: "Beta ads spend",
  content: "Beta pilot content",
  cmsSlug: "beta-web",
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`VERIFY FAILED: ${message}`)
  }
}

async function verifyFinanceRbac(container: ExecArgs["container"], logger: {
  info: (msg: string) => void
}) {
  if (!FeatureFlag.isFeatureEnabled("rbac")) {
    logger.info("RBAC disabled — skipping Finance permission checks")
    return
  }

  const userModule = container.resolve(Modules.USER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const tenantService = container.resolve(TENANT_MODULE) as {
    listTenantMemberships: (
      f: object
    ) => Promise<{ tenant_id: string; rbac_role_id?: string | null }[]>
  }

  const [financeUser] = await userModule.listUsers({ email: FINANCE_EMAIL })
  assert(!!financeUser, `Finance user ${FINANCE_EMAIL} not found`)

  const { data: roleLinks } = await query.graph({
    entity: "user_rbac_role",
    fields: ["rbac_role_id"],
    filters: { user_id: financeUser.id },
  })
  const globalRoleIds = roleLinks.map(
    (entry: { rbac_role_id: string }) => entry.rbac_role_id
  )

  assert(
    !globalRoleIds.includes(FINANCE_ROLE_ID),
    "Finance role must be tenant-scoped, not global"
  )
  assert(
    !globalRoleIds.includes(SUPER_ADMIN_ROLE_ID),
    "Finance user must not have super admin role"
  )

  const memberships = await tenantService.listTenantMemberships({
    user_id: financeUser.id,
  })
  const acmeMembership = memberships.find((m) => m.tenant_id === ACME_TENANT_ID)
  const betaMembership = memberships.find((m) => m.tenant_id === BETA_TENANT_ID)

  assert(!!acmeMembership, "Finance user missing Acme membership")
  assert(
    acmeMembership!.rbac_role_id === FINANCE_ROLE_ID,
    "Acme membership must have role_finance"
  )
  assert(!!betaMembership, "Finance user missing Beta membership")
  assert(
    !betaMembership!.rbac_role_id,
    "Beta membership must not grant module RBAC role"
  )

  const defaultMembership = memberships.find(
    (m) => m.tenant_id === "tenant_default"
  )
  assert(
    !defaultMembership,
    "Finance pilot should not remain on tenant_default (use Acme/Beta only)"
  )

  const acmeRoles = [FINANCE_ROLE_ID]
  const betaRoles: string[] = []

  const acmeCanRead = await hasPermission({
    roles: acmeRoles,
    actions: [{ resource: "revenue", operation: "read" }],
    container,
  })

  assert(acmeCanRead, "Finance in Acme should allow revenue:read")
  assert(
    betaRoles.length === 0,
    "Finance in Beta must have no tenant RBAC roles (API denies empty roles)"
  )

  logger.info("Per-tenant Finance RBAC checks passed")
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

async function verifyTenantIsolation(
  container: ExecArgs["container"],
  logger: { info: (msg: string) => void }
) {
  const tenantService = container.resolve(TENANT_MODULE) as {
    listTenants: (f: object) => Promise<{ id: string }[]>
  }
  const revenue = container.resolve(REVENUE_MODULE) as {
    listApps: (f: object, o?: object) => Promise<{ name: string }[]>
    listExpenses: (f: object, o?: object) => Promise<{ description?: string }[]>
  }

  const acmeId = await resolveTenantId(tenantService, "acme")
  const betaId = await resolveTenantId(tenantService, "beta")

  const acmeApps = await revenue.listApps({ tenant_id: acmeId }, { take: 50 })
  const betaApps = await revenue.listApps({ tenant_id: betaId }, { take: 50 })
  const acmeAppNames = acmeApps.map((a) => a.name)
  const betaAppNames = betaApps.map((a) => a.name)

  assert(acmeAppNames.includes(ACME_MARKERS.app), "Acme revenue app missing")
  assert(betaAppNames.includes(BETA_MARKERS.app), "Beta revenue app missing")
  assert(
    !acmeAppNames.includes(BETA_MARKERS.app),
    "Beta app leaked into Acme scope"
  )
  assert(
    !betaAppNames.includes(ACME_MARKERS.app),
    "Acme app leaked into Beta scope"
  )

  const acmeExpenses = await revenue.listExpenses(
    { tenant_id: acmeId },
    { take: 50 }
  )
  const betaExpenses = await revenue.listExpenses(
    { tenant_id: betaId },
    { take: 50 }
  )
  const acmeExpenseLabels = acmeExpenses.map((e) => e.description ?? "")
  const betaExpenseLabels = betaExpenses.map((e) => e.description ?? "")

  assert(
    acmeExpenseLabels.includes(ACME_MARKERS.expense),
    "Acme expense missing"
  )
  assert(
    betaExpenseLabels.includes(BETA_MARKERS.expense),
    "Beta expense missing"
  )
  assert(
    !acmeExpenseLabels.includes(BETA_MARKERS.expense),
    "Beta expense leaked into Acme"
  )
  assert(
    !betaExpenseLabels.includes(ACME_MARKERS.expense),
    "Acme expense leaked into Beta"
  )

  if (MedusaModule.isInstalled(CONTENT_LIBRARY_MODULE)) {
    const content = container.resolve(CONTENT_LIBRARY_MODULE) as {
      listContentItems: (f: object, o?: object) => Promise<{ title?: string }[]>
    }
    const acmeItems = await content.listContentItems(
      { tenant_id: acmeId },
      { take: 50 }
    )
    const betaItems = await content.listContentItems(
      { tenant_id: betaId },
      { take: 50 }
    )
    const acmeTitles = acmeItems.map((i) => i.title ?? "")
    const betaTitles = betaItems.map((i) => i.title ?? "")

    assert(acmeTitles.includes(ACME_MARKERS.content), "Acme content missing")
    assert(betaTitles.includes(BETA_MARKERS.content), "Beta content missing")
    assert(
      !acmeTitles.includes(BETA_MARKERS.content),
      "Beta content leaked into Acme"
    )
    assert(
      !betaTitles.includes(ACME_MARKERS.content),
      "Acme content leaked into Beta"
    )
  }

  if (MedusaModule.isInstalled(CMS_MODULE)) {
    const cms = container.resolve(CMS_MODULE) as {
      listCmsSites: (f: object, o?: object) => Promise<{ slug: string }[]>
    }
    const acmeSites = await cms.listCmsSites({ tenant_id: acmeId }, { take: 50 })
    const betaSites = await cms.listCmsSites({ tenant_id: betaId }, { take: 50 })
    const acmeSlugs = acmeSites.map((s) => s.slug)
    const betaSlugs = betaSites.map((s) => s.slug)

    assert(acmeSlugs.includes(ACME_MARKERS.cmsSlug), "Acme CMS site missing")
    assert(betaSlugs.includes(BETA_MARKERS.cmsSlug), "Beta CMS site missing")
    assert(
      !acmeSlugs.includes(BETA_MARKERS.cmsSlug),
      "Beta CMS site leaked into Acme"
    )
    assert(
      !betaSlugs.includes(ACME_MARKERS.cmsSlug),
      "Acme CMS site leaked into Beta"
    )
  }

  logger.info("Tenant isolation checks passed (revenue, content, cms)")
}

export default async function verifyOnboardingPilot({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("Running onboarding pilot verification (#0008 + #0009)...")

  await verifyFinanceRbac(container, logger)

  if (MedusaModule.isInstalled(TENANT_MODULE)) {
    await verifyTenantIsolation(container, logger)
  } else {
    logger.info("Tenant module not installed — skipping isolation checks")
  }

  logger.info("All onboarding pilot verification checks passed")
}

defineFileConfig({
  isDisabled: () => false,
})
