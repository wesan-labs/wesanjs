import {
  InferEntityType,
  LoaderOptions,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import { WILDCARD } from "@medusajs/framework/utils"
import { RbacPolicy, RbacRole, RbacRolePolicy } from "@models"

export default async ({
  container,
  options,
}: LoaderOptions<
  | ModulesSdkTypes.ModuleServiceInitializeOptions
  | ModulesSdkTypes.ModuleServiceInitializeCustomDataLayerOptions
>): Promise<void> => {
  const rbacRoleService = container.resolve(
    "rbacRoleService"
  ) as ModulesSdkTypes.IMedusaInternalService<InferEntityType<typeof RbacRole>>

  const rbacPolicyService = container.resolve(
    "rbacPolicyService"
  ) as ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof RbacPolicy>
  >

  const rbacRolePolicyService = container.resolve(
    "rbacRolePolicyService"
  ) as ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof RbacRolePolicy>
  >

  // Create super admin role
  const role = await rbacRoleService.upsert({
    id: "role_super_admin",
    name: "Super Admin",
    description:
      "Super admin role with full access to all resources and operations",
  })

  const policy = await rbacPolicyService.upsert({
    id: "rpol_super_admin",
    key: `${WILDCARD}:${WILDCARD}`,
    resource: WILDCARD,
    operation: WILDCARD,
    name: "Super Admin",
    description:
      "Super admin policy with full access to all resources and operations",
  })

  await rbacRolePolicyService.upsert({
    id: "rlpl_super_admin",
    role_id: role.id,
    policy_id: policy.id,
  })

  // Onboarding pilot: Finance role (revenue read + expense write)
  const financeRole = await rbacRoleService.upsert({
    id: "role_finance",
    name: "Finance",
    description:
      "Revenue dashboards and expense management (onboarding pilot role)",
  })

  const financePolicyKeys = [
    "revenue:read",
    "expense:create",
    "expense:update",
    "expense:delete",
  ]
  const syncedPolicies = await rbacPolicyService.list({}, { take: 500 })
  const policyByKey = new Map(
    syncedPolicies.map((p: { key: string; id: string }) => [p.key, p])
  )

  // Bagli tablonun dogal anahtari (role_id, policy_id) ve uzerinde unique index
  // var; `id` uzerinden upsert etmek YANLIS. Ayni cifti admin UI rastgele bir
  // id ile eklediyse upsert INSERT'e duser ve unique kisiti ihlal edip boot'u
  // kilitler. Bu yuzden once mevcut cift kumesi cekilir (tek sorgu, O(n)).
  const existingRolePolicies = await rbacRolePolicyService.list(
    { role_id: financeRole.id },
    { take: 500 }
  )
  const linkedPolicyIds = new Set(
    existingRolePolicies.map((rp: { policy_id: string }) => rp.policy_id)
  )

  const missingLinks = financePolicyKeys
    .map((key) => policyByKey.get(key))
    .filter(
      (finPolicy): finPolicy is { key: string; id: string } =>
        !!finPolicy && !linkedPolicyIds.has(finPolicy.id)
    )
    .map((finPolicy) => ({
      id: `rlpl_finance_${finPolicy.id}`,
      role_id: financeRole.id,
      policy_id: finPolicy.id,
    }))

  if (missingLinks.length) {
    await rbacRolePolicyService.create(missingLinks)
  }
}
