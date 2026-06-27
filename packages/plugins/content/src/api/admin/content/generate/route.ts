import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  generateContent,
  GenerateInput,
} from "../../../../lib/ai/content-generator"

/**
 * POST /admin/content/generate
 *
 * Vision-LLM content generation. Thin controller: delegates all work to the
 * provider-agnostic generator. Auth is enforced by Medusa's admin middleware.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<GenerateInput>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as GenerateInput

  const generation = await generateContent({
    images: body.images,
    targets: body.targets,
    tone: body.tone,
    language: body.language,
    goal: body.goal,
    media_type: body.media_type,
  })

  res.status(200).json({ generation })
}
