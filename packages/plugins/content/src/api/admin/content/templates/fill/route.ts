import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { BrandIdentity } from "../../../../../lib/brand/types"
import { buildFillData } from "../../../../../lib/templates/fill"
import { getTemplate } from "../../../../../lib/templates/loader"
import { resolveScene } from "../../../../../lib/templates/resolve"
import { validateTemplate } from "../../../../../lib/templates/schema"
import type { Template } from "../../../../../lib/templates/types"

interface FillBody {
  /** kürlenmiş kütüphaneden template id */
  templateId?: string
  /** VEYA inline template (galeri dışı) */
  template?: unknown
  brand: BrandIdentity
  media?: string
  logo?: string
}

/**
 * POST /admin/content/templates/fill
 * Template + marka → doldurulmuş sahne. color/copy DETERMINISTIK (kredisiz);
 * gerçek LLM kopya + AI görsel sonra. `{ scene, fillData }` döner — scene editöre,
 * fillData denetime. Aynı template + aynı marka → byte-identical (görsel-slot hariç).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<FillBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as FillBody

  if (!body.brand || (!body.templateId && !body.template)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "brand ve (templateId VEYA template) gerekli"
    )
  }

  let template: Template
  if (body.templateId) {
    const found = getTemplate(body.templateId)
    if (!found) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Template bulunamadı: ${body.templateId}`
      )
    }
    template = found
  } else {
    template = validateTemplate(body.template)
  }

  const fillData = buildFillData(template, body.brand, { media: body.media, logo: body.logo })
  const scene = resolveScene(template, fillData)

  res.json({ scene, fillData })
}
