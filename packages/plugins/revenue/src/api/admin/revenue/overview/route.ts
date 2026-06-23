import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const display = (req.query.display as string) || undefined
  const overview = await service.getOverview(display)
  res.status(200).json({ overview })
}
