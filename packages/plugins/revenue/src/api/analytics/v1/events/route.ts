import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"

const extractToken = (req: MedusaRequest) => {
  const header =
    req.headers.authorization ?? req.headers["x-bootstrap-token"]
  if (!header || typeof header !== "string") {
    return null
  }
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim()
  }
  return header.trim()
}

const IngestBody = z.object({
  event: z.string().min(1),
  distinct_id: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).optional(),
  occurred_at: z.string().datetime().optional(),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ ok: false, message: "Missing bootstrap token" })
  }

  const body = IngestBody.parse(req.body)
  const analytics: any = req.scope.resolve(Modules.ANALYTICS)
  const resolved = await analytics.resolveBootstrapConfig(token)

  if (!resolved.valid || !resolved.product_id) {
    return res.status(401).json({ ok: false, message: "Invalid token" })
  }

  await analytics.recordIngestEvent({
    tenant_id: resolved.tenant_id,
    product_id: resolved.product_id,
    event: body.event,
    distinct_id: body.distinct_id,
    occurred_at: body.occurred_at ? new Date(body.occurred_at) : new Date(),
    properties: body.properties ?? null,
  })

  res.status(202).json({ ok: true })
}
