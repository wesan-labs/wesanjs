import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "zod"
import {
  tenantMismatch,
  tenantScopeFilter,
} from "../../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../../modules/revenue/types"
import { PatchExpense } from "../route"

export const PATCH = async (
  req: AuthenticatedMedusaRequest<z.infer<typeof PatchExpense>>,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const [existing] = await service.listExpenses(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!existing || tenantMismatch(req, existing)) {
    return res.status(404).json({ message: "Expense not found" })
  }

  const updated = await service.updateExpenses({
    id: req.params.id,
    ...req.validatedBody,
  })
  res.status(200).json({ expense: updated })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const [existing] = await service.listExpenses(
    tenantScopeFilter(req, { id: req.params.id }),
    { take: 1 }
  )
  if (!existing || tenantMismatch(req, existing)) {
    return res.status(404).json({ message: "Expense not found" })
  }
  await service.deleteExpenses(req.params.id)
  res.status(200).json({ id: req.params.id, object: "expense", deleted: true })
}
