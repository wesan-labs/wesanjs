import type { AuthenticatedMedusaRequest } from "../types"

/**
 * Effective RBAC role ids for the current request.
 * Tenant-scoped when `tenant_rbac_role_ids` is set by tenant middleware (#0007).
 */
export function resolveEffectiveRbacRoleIds(
  req: AuthenticatedMedusaRequest
): string[] {
  const tenantRoles = req.tenant_rbac_role_ids

  if (tenantRoles !== undefined) {
    return tenantRoles
  }

  return (req.auth_context?.app_metadata?.roles as string[]) || []
}
