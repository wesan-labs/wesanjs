import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { listPacks } from "../../../../lib/packs/loader"

/**
 * GET /admin/content/packs
 * Pack Engine facet meta: sector → category → shot. UI'nın pack-first seçiciyi
 * (kart şeridi yerine) tek çağrıda çizmesi için. Deterministik, model çağrısı yok.
 */
export const GET = async (
  _req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({ packs: listPacks() })
}
