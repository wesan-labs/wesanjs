#!/usr/bin/env node

/**
 * Migration Script: Finance pilot user for onboarding (#0008).
 *
 * Creates finance@helm.local (no super admin). Per-tenant Finance role is
 * assigned by wire-per-tenant-rbac.ts after isolation pilot orgs exist.
 */

import { createUserAccountWorkflow } from "@medusajs/core-flows"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"

const FINANCE_EMAIL = "finance@helm.local"
const FINANCE_PASSWORD = "financesecret123"
const DEFAULT_TENANT_ID = "tenant_default"
const FINANCE_ROLE_ID = "role_finance"
const SUPER_ADMIN_ROLE_ID = "role_super_admin"

export default async function seedFinancePilotUser({ container }: ExecArgs) {
  if (
    !MedusaModule.isInstalled(Modules.USER) ||
    !MedusaModule.isInstalled(Modules.AUTH) ||
    !MedusaModule.isInstalled(Modules.RBAC)
  ) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("Required modules not installed. Skipping Finance pilot user.")
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)
  const rbac = container.resolve(Modules.RBAC)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info(`Seeding Finance pilot user (${FINANCE_EMAIL})...`)

  const [existingUser] = await userModule.listUsers({ email: FINANCE_EMAIL })
  let user = existingUser

  if (!user) {
    const registerResult = await authModule.register("emailpass", {
      body: { email: FINANCE_EMAIL, password: FINANCE_PASSWORD },
    })

    if (!registerResult.success || !registerResult.authIdentity) {
      throw new Error(
        registerResult.error ?? "Failed to register Finance pilot auth identity"
      )
    }

    const { result: createdUser } = await createUserAccountWorkflow(
      container
    ).run({
      input: {
        authIdentityId: registerResult.authIdentity.id,
        userData: {
          email: FINANCE_EMAIL,
          first_name: "Finance",
          last_name: "Pilot",
        },
      },
    })

    user = createdUser
    logger.info(`Created user ${user.id}`)
  } else {
    logger.info(`User already exists (${user.id})`)
  }

  const financeRoles = await rbac.listRbacRoles({ id: FINANCE_ROLE_ID })
  if (!financeRoles.length) {
    throw new Error(
      "Finance role not found. Run seed-finance-role migration first."
    )
  }

  const { data: roleLinks } = await query.graph({
    entity: "user_rbac_role",
    fields: ["rbac_role_id"],
    filters: { user_id: user.id },
  })

  const linkedRoleIds = roleLinks.map(
    (entry: { rbac_role_id: string }) => entry.rbac_role_id
  )

  if (linkedRoleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    await link.dismiss({
      [Modules.USER]: { user_id: user.id },
      [Modules.RBAC]: { rbac_role_id: SUPER_ADMIN_ROLE_ID },
    })
    logger.info("Removed super admin role from Finance pilot user")
  }

  if (MedusaModule.isInstalled("tenant")) {
    const tenantService = container.resolve("tenant") as {
      listTenantMemberships: (f: object) => Promise<{ id: string }[]>
      createTenantMemberships: (d: object) => Promise<{ id: string }>
    }

    const [membership] = await tenantService.listTenantMemberships({
      tenant_id: DEFAULT_TENANT_ID,
      user_id: user.id,
    })

    if (!membership) {
      await tenantService.createTenantMemberships({
        tenant_id: DEFAULT_TENANT_ID,
        user_id: user.id,
        role: "member",
      })
      logger.info("Added default tenant membership (member)")
    }
  }

  logger.info(
    `Finance pilot user ready — login: ${FINANCE_EMAIL} / ${FINANCE_PASSWORD}`
  )
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled("rbac"),
})
