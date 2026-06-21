import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostExpense } from "./admin/revenue/expenses/route"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/revenue*",
      method: ["GET"],
      middlewares: [],
      policies: [{ resource: "revenue", operation: "read" }],
    },
    {
      matcher: "/admin/revenue/expenses",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostExpense)],
      policies: [{ resource: "expense", operation: "create" }],
    },
  ],
})
