import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { editImage, generateText } from "../../../../lib/ai/content-generator"
import {
  getPrompt,
  renderPrompt,
  styleDirective,
} from "../../../../lib/ai/prompt-library"

interface EditImageBody {
  image: { data: string; mime: string }
  /** free-text edit instruction */
  prompt?: string
  /** OR a library image-prompt id + its variable values */
  promptId?: string
  variables?: Record<string, string>
}

/**
 * POST /admin/content/edit-image
 * Edit an uploaded image with a free-text prompt or a library image-prompt.
 * Returns the AI-edited image as a data URL.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<EditImageBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as EditImageBody

  if (!body.image?.data) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Görsel gerekli")
  }

  let instruction = body.prompt?.trim()
  if (!instruction && body.promptId) {
    const prompt = getPrompt(body.promptId)
    if (!prompt) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Prompt bulunamadı: ${body.promptId}`
      )
    }
    const rendered = renderPrompt(prompt, body.variables ?? {})

    if (prompt.content_type === "image-prompt") {
      // The library prompt is a recipe that *writes* an image brief. Two-step:
      // expand it to ONE concrete instruction, then the image model runs it on
      // the uploaded image. "transform" prompts must PRESERVE the upload (frame
      // it); "generate" prompts make new art (the upload is loose reference).
      const base =
        prompt.mode === "transform"
          ? "\n\nÖNEMLİ: SAĞLANAN görseli temel alan bir görsel-DÜZENLEME talimatı yaz (İngilizce, tek paragraf). Sağlanan görselin ana içeriğini/UI'ını OLDUĞU GİBİ koru, yeniden çizme; yalnızca etrafına çerçeve, arka plan, başlık ve marka ekle. Sadece talimat metnini döndür."
          : "\n\nÖNEMLİ: Yukarıdaki yönergeye göre SADECE TEK bir İngilizce görsel-üretim prompt'u yaz — tek paragraf, başlık/numara/açıklama YOK. Sadece prompt metnini döndür."
      const directive = base + styleDirective(body.variables)
      instruction = (
        await generateText(rendered.system, rendered.template + directive)
      ).trim()
    } else {
      instruction = `${rendered.system}\n${rendered.template}`.trim()
    }
  }

  if (!instruction) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Bir düzenleme talimatı (prompt) veya promptId gerekli"
    )
  }

  const image = await editImage(body.image, instruction)
  res.json({ image })
}
