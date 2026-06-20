import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostExpense } from "./admin/revenue/expenses/route"
// import { requirePermission } from "<mirror of packages/medusa/src/api/admin/rbac/.../middlewares>"
// RBAC permission guard deferred to Task 8 — routes are admin-authenticated only.

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/revenue*",
      method: ["GET"],
      middlewares: [
        // requirePermission("revenue:read"),
      ],
    },
    {
      matcher: "/admin/revenue/expenses",
      method: ["POST"],
      middlewares: [
        // requirePermission("expense:write"),
        validateAndTransformBody(PostExpense),
      ],
    },
  ],
})
