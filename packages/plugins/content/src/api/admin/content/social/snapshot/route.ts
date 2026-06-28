import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { captureSnapshots } from "../../../../../lib/social/snapshot"

/**
 * POST /admin/content/social/snapshot
 * Capture today's snapshot for every connected account now (seed / manual run).
 * The cron does this automatically every 6h; this lets the user trigger it.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const result = await captureSnapshots(req.scope)
  res.json(result)
}
