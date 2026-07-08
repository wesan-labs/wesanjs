import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_3D_MODULE } from "../../../../modules/product-3d"
import { createProduct3DAssetWorkflow } from "../../../../workflows/product-3d/create-3d-asset"
import { tenantScopeFilter } from "../../../lib/tenant-guard"

interface Create3DBody {
  images: string[]
  source?: "physical" | "digital-mockup"
  brand_id?: string
  product_ref?: string
}

/**
 * POST /admin/content/3d
 * Ürün görsel(ler)inden 3D varlık üretimi başlat (Tripo). Async: `processing`
 * döner; GET /:id ile poll edilir. Gerçek üretim = TRIPO_API_KEY.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<Create3DBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as Create3DBody
  if (!body.images?.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "images gerekli")
  }
  const tenantId = (req as any).tenant_id as string | undefined
  const { result } = await createProduct3DAssetWorkflow(req.scope).run({
    input: {
      images: body.images,
      source: body.source,
      product_ref: body.product_ref ?? null,
      brand_id: body.brand_id ?? null,
      tenant_id: tenantId ?? null,
    },
  })
  res.status(201).json({ asset: result })
}

/** GET /admin/content/3d — tenant-kapsamlı 3D varlık listesi (newest-first). */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(PRODUCT_3D_MODULE)
  const [assets, count] = await service.listAndCountProduct3DAssets(
    tenantScopeFilter(req, {}),
    { order: { created_at: "DESC" }, take: 100 }
  )
  res.json({ assets, count })
}
