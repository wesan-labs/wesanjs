import type { MedusaRequest } from "@medusajs/framework/http"

// CMS pilot ile aynı kural: tenant context varsa ve satır farklı tenant'a aitse → 404.
export const tenantMismatch = (
  req: MedusaRequest,
  row: { tenant_id?: string | null } | null | undefined
): boolean => {
  const ctx = (req as any).tenant_id as string | undefined
  return !!ctx && !!row?.tenant_id && row.tenant_id !== ctx
}

export const tenantScopeFilter = (
  req: MedusaRequest,
  base: Record<string, unknown> = {}
): Record<string, unknown> => {
  const tenantId = (req as any).tenant_id as string | undefined
  return tenantId ? { ...base, tenant_id: tenantId } : base
}
