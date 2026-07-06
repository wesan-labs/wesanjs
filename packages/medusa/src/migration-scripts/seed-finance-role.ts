#!/usr/bin/env node

/**
 * Migration Script: Seed Finance RBAC role for onboarding pilot (#0008).
 *
 * Creates Finance role and links revenue:read, expense:create/update/delete.
 * Idempotent — safe to re-run.
 */

import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"

const FINANCE_ROLE_NAME = "Finance"
const FINANCE_POLICY_KEYS = [
  "revenue:read",
  "expense:create",
  "expense:update",
  "expense:delete",
] as const

export default async function seedFinanceRole({ container }: ExecArgs) {
  if (!MedusaModule.isInstalled(Modules.RBAC)) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("RBAC module not installed. Skipping Finance role seed.")
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const rbac = container.resolve(Modules.RBAC)

  logger.info("Seeding Finance role for onboarding pilot...")

  const existingRoles = await rbac.listRbacRoles({ name: FINANCE_ROLE_NAME })
  let role = existingRoles[0]

  if (!role) {
    role = await rbac.createRbacRoles({
      name: FINANCE_ROLE_NAME,
      description:
        "Revenue dashboards and expense management (onboarding pilot role)",
    })
    logger.info(`Created Finance role (${role.id})`)
  } else {
    logger.info(`Finance role already exists (${role.id})`)
  }

  const allPolicies = await rbac.listRbacPolicies({})
  const byKey = new Map(
    allPolicies.map((p: { key: string; id: string }) => [p.key, p])
  )

  const existingLinks = await rbac.listRbacRolePolicies({ role_id: role.id })
  const linkedPolicyIds = new Set(
    existingLinks.map((l: { policy_id: string }) => l.policy_id)
  )

  let linked = linkedPolicyIds.size
  for (const key of FINANCE_POLICY_KEYS) {
    const policy = byKey.get(key)
    if (!policy) {
      logger.warn(
        `Policy ${key} not found — ensure revenue policies are synced before this script.`
      )
      continue
    }

    if (linkedPolicyIds.has(policy.id)) {
      continue
    }

    await rbac.createRbacRolePolicies({
      role_id: role.id,
      policy_id: policy.id,
    })
    linked++
    logger.info(`  Linked ${key} → Finance`)
  }

  logger.info(
    `Finance role ready (${role.id}): ${linked}/${FINANCE_POLICY_KEYS.length} policies linked`
  )
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled("rbac"),
})
