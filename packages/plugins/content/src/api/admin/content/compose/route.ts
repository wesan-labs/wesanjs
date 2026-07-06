import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { compose } from "../../../../lib/packs/loader"
import { ComposeError } from "../../../../lib/packs/types"

interface ComposeBody {
  packId: string
  categoryId: string
  shotId: string
  metadata?: Record<string, string>
  style?: { aspect?: string; concept?: string }
}

/**
 * POST /admin/content/compose
 * Deterministik instruction önizlemesi — pack template engine'i çalıştırır,
 * görsel model çağrısı YAPMAZ. Aynı gövde → byte-identical instruction.
 * edit-image bu çıktıyı tek hop olarak kullanır (LLM ara katmanı yok).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<ComposeBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as ComposeBody

  if (!body.packId || !body.categoryId || !body.shotId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "packId, categoryId ve shotId gerekli"
    )
  }

  try {
    const result = compose({
      packId: body.packId,
      categoryId: body.categoryId,
      shotId: body.shotId,
      metadata: body.metadata ?? {},
      style: body.style,
    })
    res.json(result)
  } catch (err) {
    if (err instanceof ComposeError) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, err.message)
    }
    throw err
  }
}
