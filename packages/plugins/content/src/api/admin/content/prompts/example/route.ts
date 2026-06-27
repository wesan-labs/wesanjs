import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  generateImage,
  generateText,
} from "../../../../../lib/ai/content-generator"
import {
  getPrompt,
  renderPrompt,
  styleDirective,
} from "../../../../../lib/ai/prompt-library"

interface ExampleBody {
  id: string
  variables?: Record<string, string>
}

/**
 * POST /admin/content/prompts/example
 * Produce a real EXAMPLE output for a prompt so the user can preview what it
 * makes. Missing variables fall back to the library's examples (renderPrompt),
 * so no input is required. Image prompts are text-to-image (no reference).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<ExampleBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as ExampleBody

  const prompt = getPrompt(body.id)
  if (!prompt) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Prompt bulunamadı: ${body.id}`
    )
  }

  const rendered = renderPrompt(prompt, body.variables ?? {})

  if (prompt.content_type === "image-prompt") {
    const directive =
      "\n\nÖNEMLİ: Yukarıdaki yönergeye göre SADECE TEK bir İngilizce görsel-üretim prompt'u yaz — tek paragraf, başlık/numara/açıklama YOK. Sadece prompt metnini döndür." +
      styleDirective(body.variables)
    const visualPrompt = (
      await generateText(rendered.system, rendered.template + directive)
    ).trim()
    const image = await generateImage(visualPrompt)
    res.json({ kind: "image", image, prompt: visualPrompt })
    return
  }

  const text = await generateText(rendered.system, rendered.template)
  res.json({ kind: "text", text })
}
