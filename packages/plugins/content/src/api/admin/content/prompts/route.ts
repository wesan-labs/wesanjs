import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getLibraryMeta,
  listPrompts,
} from "../../../../lib/ai/prompt-library"

/**
 * GET /admin/content/prompts
 * Browse the prompt library with facet filters; includes library meta
 * (facets + variable definitions + tones) so the UI can build forms in one call.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { platform, content_type, funnel_stage, tone, sector, q, limit, offset } =
    req.query as Record<string, string>

  const result = listPrompts({
    platform,
    content_type,
    funnel_stage,
    tone,
    sector,
    q,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json({ ...result, meta: getLibraryMeta() })
}
