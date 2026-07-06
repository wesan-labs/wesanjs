import { uploadFilesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

/**
 * Finance-safe invoice upload (expense:create) — avoids global file:create RBAC.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ url: string; id: string }>
) => {
  const file = (req as { file?: Express.Multer.File }).file
  if (!file) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No file uploaded")
  }

  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invoice must be PDF, JPEG, PNG, or WebP"
    )
  }

  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: [
        {
          filename: file.originalname,
          mimeType: file.mimetype,
          content: file.buffer.toString("base64"),
          access: "public",
        },
      ],
    },
  })

  const uploaded = result[0]
  if (!uploaded?.url) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Invoice upload failed"
    )
  }

  res.status(200).json({ url: uploaded.url, id: uploaded.id })
}
