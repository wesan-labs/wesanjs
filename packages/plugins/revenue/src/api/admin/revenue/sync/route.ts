import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { syncRevenuecatSources } from "../../../../modules/revenue/lib/sync"
import { syncAdmob } from "../../../../modules/revenue/lib/sync-admob"

// Manuel tetikleyici — cron beklemeden tüm kaynakları şimdi senkronla.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const revenuecat = await syncRevenuecatSources(req.scope)
  const admob = await syncAdmob(req.scope)
  res.status(200).json({ revenuecat, admob })
}
