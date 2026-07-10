import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/core-flows"
import { isSafeRemoteUrl } from "../../../../lib/three-d/rehost"

interface CreateProductBody {
  title: string
  images: string[] // data-URL (tuval) veya http(s) URL
  product_ref?: string
  description?: string
  status?: "draft" | "published"
}

/**
 * POST /admin/content/product
 * Stüdyoda üretilen varlıkları (görseller + 3D kareleri) bir MEDUSA ÜRÜNÜNE çevirir —
 * içerik üretiminin iş çıktısı (§5c adım 3). Görseller file service'e yüklenir (kalıcı
 * URL), sonra core `createProductsWorkflow` ile ürün oluşur. Native, dış sağlayıcı YOK.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateProductBody>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody ?? req.body) as CreateProductBody
  if (!body.title?.trim()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "title gerekli")
  }
  if (!body.images?.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "en az bir görsel gerekli")
  }
  if (body.images.length > 20) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "en fazla 20 görsel")
  }

  // Girdi temizliği: title/description → uzunluk + açı-parantez (stored-XSS hijyeni).
  const clean = (s: string, max: number) => s.replace(/[<>]/g, "").trim().slice(0, max)
  const title = clean(body.title, 200)
  const description = body.description ? clean(body.description, 2000) : null
  // Dosya-adı bileşeni: yalnız güvenli karakterler (path-traversal engeli).
  const refSlug = String(body.product_ref ?? "urun").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "urun"

  const fileService: any = req.scope.resolve(Modules.FILE)

  // Görselleri kalıcı depoya yükle → URL. data-URL doğrudan, remote URL SSRF-korumalı fetch.
  const toHostedUrl = async (src: string, i: number): Promise<string> => {
    let buf: Buffer
    let mime = "image/png"
    if (src.startsWith("data:")) {
      const [meta, b64] = src.split(",")
      mime = meta.slice(5, meta.indexOf(";")) || "image/png"
      buf = Buffer.from(b64, "base64")
    } else {
      if (!isSafeRemoteUrl(src)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `güvensiz görsel URL: ${i}`)
      }
      const r = await fetch(src, { redirect: "error" })
      if (!r.ok) throw new MedusaError(MedusaError.Types.INVALID_DATA, `görsel indirilemedi: ${i}`)
      buf = Buffer.from(await r.arrayBuffer())
      mime = r.headers.get("content-type")?.split(";")[0] ?? "image/png"
    }
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg"
    const [file] = await fileService.createFiles([
      { filename: `${refSlug}-${i}.${ext}`, mimeType: mime, content: buf.toString("binary") },
    ])
    return file.url
  }

  const urls = await Promise.all(body.images.map(toHostedUrl))

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          title,
          description,
          status: body.status ?? "draft",
          thumbnail: urls[0],
          images: urls.map((url) => ({ url })),
        },
      ],
    },
  })

  res.status(201).json({ product: result[0] })
}
