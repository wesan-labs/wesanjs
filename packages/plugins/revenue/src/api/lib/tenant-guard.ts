import type { MedusaRequest } from "@medusajs/framework/http"

export const getTenantId = (req: MedusaRequest): string | undefined =>
  (req as { tenant_id?: string }).tenant_id

export const tenantMismatch = (
  req: MedusaRequest,
  row: { tenant_id?: string | null } | null | undefined
): boolean => {
  const ctx = getTenantId(req)
  return !!ctx && !!row?.tenant_id && row.tenant_id !== ctx
}

export const tenantScopeFilter = (
  req: MedusaRequest,
  base: Record<string, unknown> = {}
): Record<string, unknown> => {
  const tenantId = getTenantId(req)
  return tenantId ? { ...base, tenant_id: tenantId } : base
}

/**
 * Tenant-scoped rows plus legacy rows with null tenant_id (pre–multi-tenant data).
 */
export const listWithLegacyTenantScope = async <T extends { id: string }>(
  req: MedusaRequest,
  listFn: (
    filter: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<T[]>,
  config?: Record<string, unknown>
): Promise<T[]> => {
  const tenantId = getTenantId(req)
  if (!tenantId) {
    return listFn({}, config)
  }

  const [scoped, legacy] = await Promise.all([
    listFn({ tenant_id: tenantId }, config),
    listFn({ tenant_id: null }, config),
  ])

  const byId = new Map<string, T>()
  for (const row of [...legacy, ...scoped]) {
    byId.set(row.id, row)
  }
  return Array.from(byId.values())
}

export const stampTenantId = <T extends Record<string, unknown>>(
  req: MedusaRequest,
  data: T
): T & { tenant_id?: string } => {
  const tenantId = getTenantId(req)
  return tenantId ? { ...data, tenant_id: tenantId } : data
}
