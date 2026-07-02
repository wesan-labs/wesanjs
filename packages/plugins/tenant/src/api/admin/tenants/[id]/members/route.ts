import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { addTenantMemberWorkflow } from "../../../../../workflows/manage-membership"
import {
  forbidden,
  getActorMembership,
} from "../../../../lib/require-membership"

// POST /admin/tenants/:id/members — e-posta ile üye ekle.
// Yalnız o tenant'ın ADMIN'i (security review: yetkisiz herkes kendini
// herhangi bir tenant'a ekleyebiliyordu = privilege escalation, A1'i deliyordu).
// Kullanıcı sistemde yoksa 404 (gerçek davet akışı A6).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  if (!(await getActorMembership(req, id, "admin"))) {
    res.status(403).json(forbidden())
    return
  }
  const body = req.body as { email: string; role?: string }
  const email = body.email?.trim().toLowerCase()
  if (!email) {
    res.status(400).json({
      type: "invalid_data",
      title: "Bad Request",
      detail: "email zorunlu",
    })
    return
  }

  const userService = req.scope.resolve(Modules.USER)
  const [user] = await userService.listUsers({ email })
  if (!user) {
    res.status(404).json({
      type: "not_found",
      title: "Not Found",
      detail: "bu e-postayla kullanıcı yok (davet akışı: A6)",
    })
    return
  }

  const { result } = await addTenantMemberWorkflow(req.scope).run({
    input: { tenant_id: id, user_id: user.id, role: body.role ?? "admin" },
  })
  res.status(200).json({ member: { ...result, email: user.email } })
}
