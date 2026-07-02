import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms/types"
import type CmsModuleService from "../../../../modules/cms/service"
import {
  createCmsSiteWorkflow,
  type CreateCmsSiteInput,
} from "../../../../workflows/create-cms-site"

// GET /admin/cms/sites — siteleri listele (tenant context varsa scope'lu)
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const tenantId = (req as any).tenant_id as string | undefined
  const [sites, count] = await service.listAndCountCmsSites(
    tenantId ? { tenant_id: tenantId } : {},
    { order: { created_at: "DESC" } }
  )
  res.json({ sites, count })
}

// POST /admin/cms/sites — yeni site (workflow ile; tenant context damgalanır)
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = req.body as CreateCmsSiteInput
  const tenantId = (req as any).tenant_id as string | undefined
  const { result } = await createCmsSiteWorkflow(req.scope).run({
    input: { ...body, tenant_id: tenantId ?? body.tenant_id ?? null },
  })
  res.status(200).json({ site: result })
}
