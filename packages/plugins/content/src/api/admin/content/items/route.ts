import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTENT_LIBRARY_MODULE } from "../../../../modules/content-library"
import {
  createContentItemWorkflow,
  CreateContentItemInput,
} from "../../../../workflows/content-library/create-content-item"
import { tenantScopeFilter } from "../../../lib/tenant-guard"

/** GET /admin/content/items — saved content library (newest first). */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(CONTENT_LIBRARY_MODULE)
  const { kind } = req.query as Record<string, string>
  const filters = tenantScopeFilter(req, kind ? { kind } : {})
  const [items, count] = await service.listAndCountContentItems(filters, {
    order: { created_at: "DESC" },
    take: 200,
  })
  res.json({ items, count })
}

/** POST /admin/content/items — save a generated image/text to the library. */
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateContentItemInput>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as CreateContentItemInput
  const tenantId = (req as any).tenant_id as string | undefined
  const { result } = await createContentItemWorkflow(req.scope).run({
    input: {
      ...body,
      tenant_id: tenantId ?? body.tenant_id ?? null,
    },
  })
  res.status(201).json({ item: result })
}
