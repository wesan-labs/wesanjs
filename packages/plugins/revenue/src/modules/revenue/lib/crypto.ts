import crypto from "crypto"

// Secret'lar DB'de AES-256-GCM ile ŞİFRELİ saklanır (plaintext değil).
// Anahtar mevcut app secret'ından türetilir → yeni env değişkeni gerekmez.
// (Prod'da gerçek KMS; bu solo/dev için pragmatik + plaintext'ten güvenli.)
const keyFrom = (): Buffer => {
  const seed =
    process.env.REVENUE_SECRET_KEY ||
    process.env.JWT_SECRET ||
    process.env.COOKIE_SECRET ||
    "revenue-dev-key"
  return crypto.scryptSync(seed, "revenue-secret-salt", 32)
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFrom(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString(
    "base64"
  )}`
}

export function decryptSecret(blob?: string | null): string | null {
  if (!blob) {
    return null
  }
  try {
    const [ivb, tagb, encb] = blob.split(":")
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      keyFrom(),
      Buffer.from(ivb, "base64")
    )
    decipher.setAuthTag(Buffer.from(tagb, "base64"))
    return Buffer.concat([
      decipher.update(Buffer.from(encb, "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    return null
  }
}
