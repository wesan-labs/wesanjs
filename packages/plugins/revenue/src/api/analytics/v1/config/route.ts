import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

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

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({
      valid: false,
      message: "Missing bootstrap token",
    })
  }

  const analytics: any = req.scope.resolve(Modules.ANALYTICS)
  const result = await analytics.resolveBootstrapConfig(token)

  if (!result.valid) {
    return res.status(401).json({ valid: false, message: "Invalid token" })
  }

  res.status(200).json({
    valid: true,
    tenant_id: result.tenant_id,
    product_id: result.product_id,
    config: result.config ?? {},
  })
}
