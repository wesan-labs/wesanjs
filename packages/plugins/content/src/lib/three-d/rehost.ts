import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * SSRF koruması: yalnız https + public host'a fetch. Sağlayıcı yanıtı dış girdi
 * sayılır — iç ağa (localhost, 10/172.16/192.168, link-local 169.254 = cloud
 * metadata, *.local/*.internal) işaret eden URL reddedilir. Saf.
 */
export const isSafeRemoteUrl = (raw: string): boolean => {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== "https:") return false
  const host = u.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false
  // IPv6 literal ve IPv4 private/link-local/loopback aralıkları
  if (host.includes(":")) return false
  const ip = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ip) {
    const [a, b] = [Number(ip[1]), Number(ip[2])]
    if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return false
    }
  }
  return true
}

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
  if (!isSafeRemoteUrl(remoteUrl)) return null
  try {
    const res = await fetch(remoteUrl, { redirect: "error" })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream"
    const ext = mime.includes("png")
      ? "png"
      : mime.includes("jpeg")
        ? "jpg"
        : mime.includes("mp4")
          ? "mp4"
          : mime.includes("gltf-binary") || remoteUrl.toLowerCase().includes(".glb")
            ? "glb"
            : "bin"
    const fileService: any = container.resolve(Modules.FILE)
    const [file] = await fileService.createFiles([
      { filename: `${name}.${ext}`, mimeType: mime, content: buf.toString("binary") },
    ])
    return file?.url ?? null
  } catch {
    return null
  }
}
