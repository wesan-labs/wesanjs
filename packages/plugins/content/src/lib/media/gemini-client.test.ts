import { describe, expect, test } from "bun:test"
import { parseDataUrl, toDataUrl } from "./gemini-client"

describe("parseDataUrl / toDataUrl (reusable saf yardımcılar)", () => {
  test("data-URL → {mime,data} → data-URL round-trip", () => {
    const p = parseDataUrl("data:image/png;base64,AAAB")
    expect(p).toEqual({ mime: "image/png", data: "AAAB" })
    expect(toDataUrl(p)).toBe("data:image/png;base64,AAAB")
  })
  test("jpeg mime", () => {
    expect(parseDataUrl("data:image/jpeg;base64,ZZ").mime).toBe("image/jpeg")
  })
})
