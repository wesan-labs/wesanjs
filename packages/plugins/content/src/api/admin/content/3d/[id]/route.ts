import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_3D_MODULE } from "../../../../../modules/product-3d"
import { pollProduct3DAssetWorkflow } from "../../../../../workflows/product-3d/poll-3d-asset"
import { tenantMismatch } from "../../../../lib/tenant-guard"

/**
 * GET /admin/content/3d/:id
 * Varlığı döndür; `processing` ise sağlayıcıyı poll edip günceller (poll-on-read).
 * Frontend `ready`/`failed` olana dek bunu poll eder.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(PRODUCT_3D_MODULE)
  const existing = await service.retrieveProduct3DAsset(req.params.id)
  if (tenantMismatch(req, existing)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "3D varlık bulunamadı")
  }

  const { result } = await pollProduct3DAssetWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  res.json({ asset: result })
}
