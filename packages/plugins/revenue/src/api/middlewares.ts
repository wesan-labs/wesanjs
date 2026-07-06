import {
  defineMiddlewares,
  validateAndTransformBody,
  type MiddlewareFunction,
  type MiddlewareRoute,
} from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import multer from "multer"
import { PatchExpense, PostExpense } from "./admin/revenue/expenses/route"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const uploadInvoice: MiddlewareFunction = upload.single(
  "file"
) as MiddlewareFunction

const routes: MiddlewareRoute[] = [
  {
    matcher: "/admin/revenue*",
    method: ["GET"],
    middlewares: [],
    policies: [{ resource: "revenue", operation: PolicyOperation.read }],
  },
  {
    matcher: "/admin/revenue/expenses",
    method: ["POST"],
    middlewares: [validateAndTransformBody(PostExpense)],
    policies: [{ resource: "expense", operation: PolicyOperation.create }],
  },
  {
    matcher: "/admin/revenue/expenses/:id",
    method: ["PATCH"],
    middlewares: [validateAndTransformBody(PatchExpense)],
    policies: [{ resource: "expense", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/revenue/expenses/invoice-upload",
    method: ["POST"],
    middlewares: [uploadInvoice],
    policies: [{ resource: "expense", operation: PolicyOperation.create }],
  },
  {
    matcher: "/admin/revenue/expenses/:id",
    method: ["DELETE"],
    policies: [{ resource: "expense", operation: PolicyOperation.delete }],
  },
  {
    matcher: "/admin/revenue/sync",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/revenue/settings",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/revenue/integrations",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/revenue/apps",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.create }],
  },
  {
    matcher: "/admin/revenue/apps/:id",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/revenue/apps/:id",
    method: ["DELETE"],
    policies: [{ resource: "revenue", operation: PolicyOperation.delete }],
  },
  {
    matcher: "/admin/revenue/sources",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.create }],
  },
  {
    matcher: "/admin/revenue/sources/:id",
    method: ["DELETE"],
    policies: [{ resource: "revenue", operation: PolicyOperation.delete }],
  },
  {
    matcher: "/admin/analytics*",
    method: ["GET"],
    middlewares: [],
    policies: [{ resource: "revenue", operation: PolicyOperation.read }],
  },
  {
    matcher: "/admin/analytics/products",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.create }],
  },
  {
    matcher: "/admin/analytics/products/:id",
    method: ["PATCH"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/analytics/products/:id/bootstrap",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/analytics/sync",
    method: ["POST"],
    policies: [{ resource: "revenue", operation: PolicyOperation.update }],
  },
  {
    matcher: "/admin/analytics/products/:id/funnel",
    method: ["GET"],
    policies: [{ resource: "revenue", operation: PolicyOperation.read }],
  },
]

export default defineMiddlewares({ routes })
