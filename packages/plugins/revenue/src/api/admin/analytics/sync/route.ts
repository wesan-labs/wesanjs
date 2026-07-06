import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { syncAnalyticsSnapshots } from "../../../lib/analytics-sync"
import { getTenantId } from "../../../lib/tenant-guard"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const tenantId = getTenantId(req)
  const days = req.query.days
    ? Number.parseInt(String(req.query.days), 10)
    : undefined

  const result = await syncAnalyticsSnapshots(req.scope, {
    tenantId,
    days: Number.isFinite(days) && days! > 0 ? days : undefined,
  })

  res.status(200).json({ sync: result })
}
