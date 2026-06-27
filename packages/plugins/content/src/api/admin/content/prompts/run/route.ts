import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { generateText } from "../../../../../lib/ai/content-generator"
import { getPrompt, renderPrompt } from "../../../../../lib/ai/prompt-library"

interface RunBody {
  id: string
  variables?: Record<string, string>
}

/**
 * POST /admin/content/prompts/run
 * Fill a library prompt's {{VARIABLE}} placeholders with the supplied values,
 * then run system + template through the AI. Returns the generated text.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<RunBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as RunBody

  const prompt = getPrompt(body.id)
  if (!prompt) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Prompt bulunamadı: ${body.id}`
    )
  }

  const { system, template } = renderPrompt(prompt, body.variables ?? {})
  const text = await generateText(system, template)

  res.json({ id: prompt.id, title: prompt.title, output: prompt.output, text })
}
