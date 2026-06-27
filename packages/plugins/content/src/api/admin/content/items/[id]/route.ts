import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { deleteContentItemWorkflow } from "../../../../../workflows/content-library/delete-content-item"

/** DELETE /admin/content/items/:id — remove a saved item. */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  await deleteContentItemWorkflow(req.scope).run({ input: { id } })
  res.json({ id, object: "content_item", deleted: true })
}
