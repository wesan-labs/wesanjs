/**
 * Per-tenant RBAC role resolution (#0007).
 *
 * Called only when `x-tenant-id` is present and membership is validated.
 * Returns the effective module role ids for policy checks in that org.
 */

export const SUPER_ADMIN_ROLE_ID = "role_super_admin"

export type TenantMembershipRbac = {
  role: string
  rbac_role_id?: string | null
}

export type TenantRbacContext = {
  /** Roles from JWT `app_metadata.roles` (global user ↔ rbac links). */
  globalRoleIds: string[]
}

/**
 * Rules (in order):
 * 1. Platform super admin → global roles everywhere (operator bypass).
 * 2. Explicit `membership.rbac_role_id` → that role only in this org.
 * 3. Org `admin` without explicit module role → inherit global module roles.
 * 4. `manager` / `member` without `rbac_role_id` → no module permissions (`[]`).
 */
export function resolveTenantRbacRoleIds(
  membership: TenantMembershipRbac,
  ctx: TenantRbacContext
): string[] {
  const { globalRoleIds } = ctx

  if (globalRoleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    return globalRoleIds
  }

  if (membership.rbac_role_id) {
    return [membership.rbac_role_id]
  }

  if (membership.role === "admin" && globalRoleIds.length > 0) {
    return globalRoleIds
  }

  return []
}
