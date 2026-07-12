import { defineMiddlewares } from "@medusajs/framework/http"

/**
 * Content generation sends base64 image/video frames in the JSON body, which
 * easily exceeds Medusa's default body limit. Without this, the body parser
 * rejects the request before CORS runs → browser sees a CORS error + 500.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/content/generate",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
    {
      matcher: "/admin/content/edit-image",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
    {
      matcher: "/admin/content/analyze",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
    {
      matcher: "/admin/content/items",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
    {
      // 3D zinciri: tuval görseli data-URL (base64) olarak gelir (BFL kabul
      // ediyor, canlı-kanıt 2026-07-08) — default limit 413 verir.
      matcher: "/admin/content/3d",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
    {
      // Ürün oluşturma: görseller data-URL (base64) olarak gelir.
      matcher: "/admin/content/product",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
    {
      // Outcome-akış taslağı: çoklu ürün fotoğrafı data-URL.
      matcher: "/admin/content/studio/draft",
      method: "POST",
      bodyParser: { sizeLimit: "25mb" },
    },
  ],
})
