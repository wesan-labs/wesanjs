import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { REVENUE_MODULE } from "../../../../../modules/revenue/types"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  await service.deleteExpenses(req.params.id)
  res.status(200).json({ id: req.params.id, object: "expense", deleted: true })
}
