import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

// Per-app kırılım: her ürün + son snapshot metrikleri.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const display = (req.query.display as string) || undefined
  const apps = await service.getAppsOverview(display)
  res.status(200).json({ apps })
}
