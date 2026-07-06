#!/usr/bin/env node

/**
 * Migration Script: Wire per-tenant RBAC for Finance pilot (#0007 + #0008).
 *
 * Moves finance@helm.local module role from global user link to Acme membership.
 */

import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"

const FINANCE_EMAIL = "finance@helm.local"
const FINANCE_ROLE_ID = "role_finance"
const ACME_TENANT_ID = "tenant_acme"
const BETA_TENANT_ID = "tenant_beta"
const TENANT_MODULE = "tenant"

export default async function wirePerTenantRbac({ container }: ExecArgs) {
  if (
    !MedusaModule.isInstalled(Modules.USER) ||
    !MedusaModule.isInstalled(Modules.RBAC) ||
    !MedusaModule.isInstalled(TENANT_MODULE)
  ) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("Required modules not installed. Skipping per-tenant RBAC wire.")
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userModule = container.resolve(Modules.USER)
  const linkService = container.resolve(ContainerRegistrationKeys.LINK)
  const tenantService = container.resolve(TENANT_MODULE) as {
    listTenantMemberships: (
      f: object
    ) => Promise<
      {
        id: string
        tenant_id: string
        user_id: string
        role: string
        rbac_role_id?: string | null
      }[]
    >
    updateTenantMemberships: (d: object) => Promise<unknown>
    createTenantMemberships: (d: object) => Promise<{ id: string }>
    deleteTenantMemberships: (id: string) => Promise<unknown>
  }

  const [financeUser] = await userModule.listUsers({ email: FINANCE_EMAIL })
  if (!financeUser) {
    logger.info("Finance user not found — run seed-finance-pilot-user first.")
    return
  }

  logger.info("Wiring per-tenant RBAC for Finance pilot...")

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: roleLinks } = await query.graph({
    entity: "user_rbac_role",
    fields: ["rbac_role_id"],
    filters: { user_id: financeUser.id },
  })

  const hasGlobalFinance = roleLinks.some(
    (entry: { rbac_role_id: string }) => entry.rbac_role_id === FINANCE_ROLE_ID
  )

  if (hasGlobalFinance) {
    await linkService.dismiss({
      [Modules.USER]: { user_id: financeUser.id },
      [Modules.RBAC]: { rbac_role_id: FINANCE_ROLE_ID },
    })
    logger.info("Removed global Finance role from user")
  }

  const ensureMembership = async (
    tenantId: string,
    role: string,
    rbacRoleId: string | null
  ) => {
    const [membership] = await tenantService.listTenantMemberships({
      tenant_id: tenantId,
      user_id: financeUser.id,
    })

    if (!membership) {
      await tenantService.createTenantMemberships({
        tenant_id: tenantId,
        user_id: financeUser.id,
        role,
        rbac_role_id: rbacRoleId,
      })
      logger.info(`Created ${tenantId} membership (role=${role})`)
      return
    }

    if (
      membership.rbac_role_id !== rbacRoleId ||
      (role && membership.role !== role)
    ) {
      await tenantService.updateTenantMemberships({
        id: membership.id,
        role,
        rbac_role_id: rbacRoleId,
      })
      logger.info(`Updated ${tenantId} membership rbac_role_id=${rbacRoleId}`)
    }
  }

  await ensureMembership(ACME_TENANT_ID, "member", FINANCE_ROLE_ID)
  await ensureMembership(BETA_TENANT_ID, "member", null)

  // Default org is confusing for pilot — finance should only demo Acme/Beta.
  const defaultMemberships = await tenantService.listTenantMemberships({
    tenant_id: "tenant_default",
    user_id: financeUser.id,
  })
  if (defaultMemberships.length) {
    await tenantService.deleteTenantMemberships(defaultMemberships[0].id)
    logger.info("Removed finance user from tenant_default (pilot clarity)")
  }

  logger.info(
    "Per-tenant RBAC wired — Finance role active only in Acme (tenant_acme)"
  )
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled("rbac"),
})
