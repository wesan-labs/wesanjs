import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Sağlayıcı çıktısını (geçici URL: BFL ~10dk, Ark 24s, WS CDN) indir + Medusa
 * file service'e kalıcı kaydet. Başarısızlıkta null döner — çağıran remote URL'e
 * düşer (zincir kalıcılık yüzünden ASLA kırılmaz). Time O(dosya boyutu).
 */
export const rehostOutput = async (
  container: MedusaContainer,
  remoteUrl: string,
  name: string
): Promise<string | null> => {
  try {
    const res = await fetch(remoteUrl)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream"
    const ext = mime.includes("png") ? "png" : mime.includes("jpeg") ? "jpg" : mime.includes("mp4") ? "mp4" : "bin"
    const fileService: any = container.resolve(Modules.FILE)
    const [file] = await fileService.createFiles([
      { filename: `${name}.${ext}`, mimeType: mime, content: buf.toString("binary") },
    ])
    return file?.url ?? null
  } catch {
    return null
  }
}
