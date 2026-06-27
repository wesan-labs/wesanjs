import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { analyzeImage } from "../../../../lib/ai/content-generator"

interface AnalyzeBody {
  image: { data: string; mime: string }
}

/**
 * POST /admin/content/analyze
 * Vision-analyze an uploaded image → { sector, summary, fields } so the studio
 * can auto-select the sector and pre-fill brand variables.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AnalyzeBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as AnalyzeBody
  if (!body.image?.data) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Görsel gerekli")
  }
  const analysis = await analyzeImage(body.image)
  res.json({ analysis })
}
