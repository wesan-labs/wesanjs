import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { parseDataUrl } from "../../../../../lib/media/gemini-client"
import { produceDraft } from "../../../../../lib/media/studio-draft"

interface DraftBody {
  images: string[] // data-URL
  product_name?: string
}

/**
 * POST /admin/content/studio/draft
 * Outcome-akışı ③: ürün fotoğrafları → tek-geçiş taslak (temiz görsel + açıklama +
 * caption). Pipeline gizli; kullanıcı sadece taslağı görür. Reusable üreticiyi çağırır.
 */
export const POST = async (req: AuthenticatedMedusaRequest<DraftBody>, res: MedusaResponse) => {
  const body = (req.validatedBody ?? req.body) as DraftBody
  if (!body.images?.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "en az bir ürün fotoğrafı gerekli")
  }
  const images = body.images.filter((s) => s?.startsWith("data:")).slice(0, 8).map(parseDataUrl)
  if (!images.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "geçerli görsel yok (data-URL bekleniyor)")
  }
  try {
    const draft = await produceDraft(images, body.product_name?.trim() || undefined)
    res.status(201).json({ draft })
  } catch (e) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, (e as Error)?.message ?? "taslak üretilemedi")
  }
}
