import {
  resolveTenantRbacRoleIds,
  SUPER_ADMIN_ROLE_ID,
} from "../resolve-tenant-rbac-roles"

const FINANCE_ROLE_ID = "role_finance"

function assertEqual(actual: string[], expected: string[], label: string) {
  const a = [...actual].sort().join(",")
  const e = [...expected].sort().join(",")
  if (a !== e) {
    throw new Error(`${label}: expected [${e}], got [${a}]`)
  }
}

/**
 * Pure unit checks for tenant RBAC resolver — run from verify-onboarding-pilot.
 */
export function runResolveTenantRbacRoleIdsTests() {
  assertEqual(
    resolveTenantRbacRoleIds(
      { role: "member", rbac_role_id: FINANCE_ROLE_ID },
      { globalRoleIds: [] }
    ),
    [FINANCE_ROLE_ID],
    "explicit rbac_role_id"
  )

  assertEqual(
    resolveTenantRbacRoleIds(
      { role: "member", rbac_role_id: null },
      { globalRoleIds: [] }
    ),
    [],
    "member without rbac_role_id"
  )

  assertEqual(
    resolveTenantRbacRoleIds(
      { role: "admin", rbac_role_id: null },
      { globalRoleIds: [FINANCE_ROLE_ID] }
    ),
    [FINANCE_ROLE_ID],
    "org admin inherits global module roles"
  )

  assertEqual(
    resolveTenantRbacRoleIds(
      { role: "admin", rbac_role_id: null },
      { globalRoleIds: [SUPER_ADMIN_ROLE_ID] }
    ),
    [SUPER_ADMIN_ROLE_ID],
    "super admin bypass"
  )

  assertEqual(
    resolveTenantRbacRoleIds(
      { role: "member", rbac_role_id: FINANCE_ROLE_ID },
      { globalRoleIds: [SUPER_ADMIN_ROLE_ID] }
    ),
    [SUPER_ADMIN_ROLE_ID],
    "super admin overrides membership rbac_role_id"
  )

  assertEqual(
    resolveTenantRbacRoleIds(
      { role: "member", rbac_role_id: null },
      { globalRoleIds: [SUPER_ADMIN_ROLE_ID] }
    ),
    [SUPER_ADMIN_ROLE_ID],
    "super admin on member membership"
  )
}
