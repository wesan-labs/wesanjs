import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import {
  listWithLegacyTenantScope,
  stampTenantId,
  tenantMismatch,
  tenantScopeFilter,
} from "../../../../api/lib/tenant-guard"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const expenses = await listWithLegacyTenantScope(
    req,
    (filter, config) => service.listExpenses(filter, config),
    { order: { occurred_at: "DESC" }, take: 100 }
  )
  res.status(200).json({ expenses })
}

export const PostExpense = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  category: z.enum(["infra", "api", "ads", "other"]).default("other"),
  occurred_at: z.coerce.date(),
  recurring: z.boolean().default(false),
  app_id: z.string().nullable().optional(),
  vendor: z.string().trim().min(1).optional().nullable(),
  invoice_number: z.string().trim().min(1).optional().nullable(),
  invoice_url: z.string().url().optional().nullable(),
})

export const PatchExpense = z
  .object({
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().min(3).max(3).optional(),
    category: z.enum(["infra", "api", "ads", "other"]).optional(),
    occurred_at: z.coerce.date().optional(),
    recurring: z.boolean().optional(),
    vendor: z.string().trim().min(1).optional().nullable(),
    invoice_number: z.string().trim().min(1).optional().nullable(),
    invoice_url: z.string().url().optional().nullable(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required",
  })

export const POST = async (
  req: AuthenticatedMedusaRequest<z.infer<typeof PostExpense>>,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const created = await service.createExpenses(
    stampTenantId(req, {
      ...req.validatedBody,
      created_by: req.auth_context?.actor_id ?? null,
    })
  )
  res.status(201).json({ expense: created })
}
