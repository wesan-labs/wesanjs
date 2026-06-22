import { decryptSecret, encryptSecret } from "../crypto"

describe("secret crypto", () => {
  it("encrypt → decrypt round-trip, ciphertext is not plaintext", () => {
    const key = "sk_revenuecat_secret_123"
    const enc = encryptSecret(key)
    expect(enc).not.toContain(key)
    expect(enc.split(":")).toHaveLength(3)
    expect(decryptSecret(enc)).toBe(key)
  })

  it("decrypt garbage → null (bozuk veri hesabı bozmaz)", () => {
    expect(decryptSecret("not-valid")).toBeNull()
    expect(decryptSecret(null)).toBeNull()
  })
})
