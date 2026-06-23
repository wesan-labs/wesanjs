import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

// Reklam detayı: günlük seri + ürün×platform satırları (display birimine normalize).
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const display = (req.query.display as string) || undefined
  const breakdown = await service.getAdBreakdown(display)
  res.status(200).json({ breakdown })
}
