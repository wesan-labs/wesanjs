import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { BrandIdentity } from "../../../../lib/brand/types"
import { compose, composeWithBrand } from "../../../../lib/packs/loader"
import { ComposeError } from "../../../../lib/packs/types"

interface ComposeBody {
  /** hazır pack yolu (elle-yazım / seed) */
  packId?: string
  /** VEYA marka-güdümlü yol: markayı derle (cache'li) → compose (compile-and-cache) */
  brand?: BrandIdentity
  categoryId: string
  shotId: string
  metadata?: Record<string, string>
  style?: { aspect?: string; concept?: string }
}

/**
 * POST /admin/content/compose
 * Deterministik instruction önizlemesi — görsel model çağrısı YAPMAZ, byte-identical.
 * İki yol: (a) `packId` ile hazır pack, (b) `brand` ile derlenmiş (cache'li) pack —
 * ikincisi keyfi alan için, kimse dikey-özel pack yazmaz (compile-and-cache).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<ComposeBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as ComposeBody

  if (!body.categoryId || !body.shotId || (!body.packId && !body.brand)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "categoryId, shotId ve (packId VEYA brand) gerekli"
    )
  }

  try {
    const input = {
      packId: body.packId ?? `brand-${body.brand?.id}`,
      categoryId: body.categoryId,
      shotId: body.shotId,
      metadata: body.metadata ?? {},
      style: body.style,
    }
    const result = body.brand
      ? composeWithBrand(input, body.brand)
      : compose(input)
    res.json(result)
  } catch (err) {
    if (err instanceof ComposeError) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, err.message)
    }
    throw err
  }
}
