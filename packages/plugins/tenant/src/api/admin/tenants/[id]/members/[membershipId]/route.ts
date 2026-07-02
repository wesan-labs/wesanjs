import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { removeTenantMemberWorkflow } from "../../../../../../workflows/manage-membership"

// DELETE /admin/tenants/:id/members/:membershipId — üyeliği kaldır.
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { membershipId } = req.params
  await removeTenantMemberWorkflow(req.scope).run({
    input: { membership_id: membershipId },
  })
  res.status(200).json({ id: membershipId, deleted: true })
}
