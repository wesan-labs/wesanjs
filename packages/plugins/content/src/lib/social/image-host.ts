/**
 * Public image hosting so generated (base64) studio images get a URL the social
 * provider can fetch — Zernio/Late only accept public URLs, and our images are
 * local data URLs. Env-gated + provider-agnostic (like the social provider):
 *
 *   IMAGE_HOST=imgbb       + IMGBB_API_KEY
 *   IMAGE_HOST=cloudinary  + CLOUDINARY_CLOUD + CLOUDINARY_PRESET (unsigned preset)
 *
 * Both are dependency-free (fetch only). Swap to R2/S3 later by adding a branch.
 */

const host = (): string => (process.env.IMAGE_HOST || "").toLowerCase()

export const isImageHostConfigured = (): boolean => {
  switch (host()) {
    case "imgbb":
      return !!process.env.IMGBB_API_KEY
    case "cloudinary":
      return !!(process.env.CLOUDINARY_CLOUD && process.env.CLOUDINARY_PRESET)
    default:
      return false
  }
}

const stripDataUrl = (s: string): string => {
  const m = s.match(/^data:.+?;base64,(.+)$/)
  return m ? m[1] : s
}

/** Upload a data URL (or raw base64) and return a public https URL. */
export async function uploadImage(dataUrl: string): Promise<string> {
  switch (host()) {
    case "imgbb": {
      const key = process.env.IMGBB_API_KEY!
      const body = new URLSearchParams({ image: stripDataUrl(dataUrl) })
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: "POST",
        body,
      })
      const j = (await res.json()) as {
        data?: { url?: string }
        error?: { message?: string }
      }
      if (!res.ok || !j.data?.url) {
        throw new Error(j.error?.message || `imgbb upload failed (${res.status})`)
      }
      return j.data.url
    }
    case "cloudinary": {
      const cloud = process.env.CLOUDINARY_CLOUD!
      const preset = process.env.CLOUDINARY_PRESET!
      const form = new FormData()
      // Cloudinary accepts a full data URI as `file`.
      form.append("file", dataUrl)
      form.append("upload_preset", preset)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        { method: "POST", body: form }
      )
      const j = (await res.json()) as {
        secure_url?: string
        error?: { message?: string }
      }
      if (!res.ok || !j.secure_url) {
        throw new Error(
          j.error?.message || `cloudinary upload failed (${res.status})`
        )
      }
      return j.secure_url
    }
    default:
      throw new Error(
        "IMAGE_HOST yapılandırılmamış — IMGBB_API_KEY veya CLOUDINARY_* ekleyin ya da hazır public URL girin."
      )
  }
}
