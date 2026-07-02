import type { MedusaRequest } from "@medusajs/framework/http"

// A1 satır-seviyesi tenant koruması (app katmanı; RLS defense-in-depth ayrı).
// Kural: istekte tenant context VARSA ve satırın tenant'ı FARKLIYSA → erişim yok
// (404 — varlık sızdırmamak için 403 değil). Satır tenant'sızsa (legacy) görünür.
export const tenantMismatch = (
  req: MedusaRequest,
  row: { tenant_id?: string | null } | null | undefined
): boolean => {
  const ctx = (req as any).tenant_id as string | undefined
  return !!ctx && !!row?.tenant_id && row.tenant_id !== ctx
}
