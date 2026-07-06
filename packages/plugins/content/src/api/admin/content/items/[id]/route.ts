import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTENT_LIBRARY_MODULE } from "../../../../../modules/content-library"
import { deleteContentItemWorkflow } from "../../../../../workflows/content-library/delete-content-item"
import { tenantMismatch } from "../../../../lib/tenant-guard"

/** DELETE /admin/content/items/:id — remove a saved item. */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: any = req.scope.resolve(CONTENT_LIBRARY_MODULE)
  const item = await service.retrieveContentItem(id)
  if (tenantMismatch(req, item)) {
    res.status(404).json({ message: "Not found" })
    return
  }
  await deleteContentItemWorkflow(req.scope).run({ input: { id } })
  res.json({ id, object: "content_item", deleted: true })
}
