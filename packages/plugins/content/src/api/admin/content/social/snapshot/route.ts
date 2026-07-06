import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { captureTenantSnapshots } from "../../../../../lib/social/snapshot"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const tenantId = (req as { tenant_id?: string }).tenant_id
  if (!tenantId) {
    res.status(400).json({ error: "x-tenant-id gerekli." })
    return
  }
  const result = await captureTenantSnapshots(req.scope, tenantId)
  res.json(result)
}
