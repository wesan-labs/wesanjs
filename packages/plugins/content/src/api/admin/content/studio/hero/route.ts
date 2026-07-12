import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { parseDataUrl } from "../../../../../lib/media/gemini-client"
import { produceHero } from "../../../../../lib/media/studio-draft"

interface Body {
  images: string[]
}

/** POST /admin/content/studio/hero — sadece temiz görseli yeniden üret (review "yeniden"). */
export const POST = async (req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) => {
  const body = (req.validatedBody ?? req.body) as Body
  const images = (body.images ?? []).filter((s) => s?.startsWith("data:")).slice(0, 8).map(parseDataUrl)
  if (!images.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "geçerli görsel yok")
  }
  try {
    res.status(201).json({ image: await produceHero(images) })
  } catch (e) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, (e as Error)?.message ?? "görsel üretilemedi")
  }
}
