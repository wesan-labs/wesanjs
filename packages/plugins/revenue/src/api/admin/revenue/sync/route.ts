import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getTenantId } from "../../../../api/lib/tenant-guard"
import { syncRevenuecatSources } from "../../../../modules/revenue/lib/sync"
import { syncAdmob } from "../../../../modules/revenue/lib/sync-admob"

// Manuel tetikleyici — cron beklemeden tüm kaynakları şimdi senkronla.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const tenantId = getTenantId(req)
  const revenuecat = await syncRevenuecatSources(req.scope, tenantId)
  const admob = await syncAdmob(req.scope, tenantId)
  res.status(200).json({ revenuecat, admob })
}
