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
      { filename: `${body.product_ref ?? "urun"}-${i}.${ext}`, mimeType: mime, content: buf.toString("binary") },
    ])
    return file.url
  }

  const urls = await Promise.all(body.images.map(toHostedUrl))

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          title: body.title.trim(),
          description: body.description ?? null,
          status: body.status ?? "draft",
          thumbnail: urls[0],
          images: urls.map((url) => ({ url })),
        },
      ],
    },
  })

  res.status(201).json({ product: result[0] })
}
