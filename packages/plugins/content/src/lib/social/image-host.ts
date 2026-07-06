/**
 * Public image hosting — **platform operator** configures IMAGE_HOST in server
 * .env (not per-tenant). Tenants upload via publish route; files are public URLs
 * the social provider can fetch.
 *
 *   IMAGE_HOST=imgbb       + IMGBB_API_KEY
 *   IMAGE_HOST=cloudinary  + CLOUDINARY_CLOUD + CLOUDINARY_PRESET (unsigned preset)
 *   IMAGE_HOST=r2          + R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID,
 *                            R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL
 */

import { randomBytes } from "node:crypto"

const host = (): string => (process.env.IMAGE_HOST || "").toLowerCase()

const r2Configured = (): boolean =>
  !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_PUBLIC_URL
  )

export const isImageHostConfigured = (): boolean => {
  switch (host()) {
    case "imgbb":
      return !!process.env.IMGBB_API_KEY
    case "cloudinary":
      return !!(process.env.CLOUDINARY_CLOUD && process.env.CLOUDINARY_PRESET)
    case "r2":
      return r2Configured()
    default:
      return false
  }
}

const stripDataUrl = (s: string): string => {
  const m = s.match(/^data:.+?;base64,(.+)$/)
  return m ? m[1] : s
}

const mimeFromDataUrl = (dataUrl: string): { ext: string; contentType: string } => {
  const m = dataUrl.match(/^data:image\/(\w+)/)
  const raw = m?.[1]?.toLowerCase() || "png"
  const ext = raw === "jpeg" ? "jpg" : raw
  const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`
  return { ext, contentType }
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
    case "r2": {
      if (!r2Configured()) {
        throw new Error("R2 credentials incomplete — check R2_* env vars")
      }
      const accountId = process.env.R2_ACCOUNT_ID!
      const bucket = process.env.R2_BUCKET!
      const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "")
      const { ext, contentType } = mimeFromDataUrl(dataUrl)
      const key = `social/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`
      const buffer = Buffer.from(stripDataUrl(dataUrl), "base64")

      const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3")
      const client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      })
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      )
      return `${publicBase}/${key}`
    }
    default:
      throw new Error(
        "IMAGE_HOST yapılandırılmamış — IMGBB_API_KEY, CLOUDINARY_* veya R2_* ekleyin ya da hazır public URL girin."
      )
  }
}
