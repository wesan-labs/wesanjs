import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { listTemplates, recommendTemplates } from "../../../../lib/templates/loader"

/**
 * GET /admin/content/templates
 * Kürlenmiş template kütüphanesi. `?domain=<metin>` verilirse markaya göre
 * önerili sıra (recommendTemplates), yoksa tam liste. `?format=` ile filtre.
 * Deterministik, model çağrısı yok. domain = iş kategorisi (PII değil) → query güvenli.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const domain = typeof req.query.domain === "string" ? req.query.domain : undefined
  const format = typeof req.query.format === "string" ? req.query.format : undefined

  const templates = domain
    ? recommendTemplates({ domain }).filter((t) => !format || t.format === format)
    : listTemplates(format ? { format } : undefined)

  res.json({ templates })
}
