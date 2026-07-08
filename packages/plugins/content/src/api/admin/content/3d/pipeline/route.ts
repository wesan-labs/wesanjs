import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { DEFAULT_PIPELINE, OPERATIONS } from "../../../../../lib/three-d/pipeline-def"
import { envKeyFor } from "../../../../../lib/three-d/step-registry"

/**
 * GET /admin/content/3d/pipeline
 * Pipeline TANIMI (§5b B4) — UI operasyon kartlarını buradan render eder:
 * op + label + op-spec (salt-okunur) + provider + params + key durumu.
 * Key DEĞERİ asla dönmez; sadece adı + tanımlı-mı bool'u.
 */
export const GET = async (
  _req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const steps = DEFAULT_PIPELINE.map((d) => {
    const envKey = envKeyFor(d.provider)
    return {
      op: d.op,
      label: OPERATIONS[d.op]?.label ?? d.op,
      op_spec: OPERATIONS[d.op]?.opSpec ?? null,
      provider: d.provider,
      params: d.params,
      env_key: envKey,
      key_configured: !!(envKey && process.env[envKey]),
    }
  })
  res.json({ steps })
}
