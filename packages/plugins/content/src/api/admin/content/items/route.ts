import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTENT_LIBRARY_MODULE } from "../../../../modules/content-library"
import {
  createContentItemWorkflow,
  CreateContentItemInput,
} from "../../../../workflows/content-library/create-content-item"

/** GET /admin/content/items — saved content library (newest first). */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(CONTENT_LIBRARY_MODULE)
  const { kind } = req.query as Record<string, string>
  const [items, count] = await service.listAndCountContentItems(
    kind ? { kind } : {},
    { order: { created_at: "DESC" }, take: 200 }
  )
  res.json({ items, count })
}

/** POST /admin/content/items — save a generated image/text to the library. */
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateContentItemInput>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as CreateContentItemInput
  const { result } = await createContentItemWorkflow(req.scope).run({
    input: body,
  })
  res.status(201).json({ item: result })
}
