import { describe, expect, test } from "bun:test"
import { buildHeroPrompt, mapBflStatus, toFluxBody } from "./bfl"

describe("mapBflStatus", () => {
  test("Pending→processing, Ready→ready, gerisi→failed", () => {
    expect(mapBflStatus("Pending")).toBe("processing")
    expect(mapBflStatus("Ready")).toBe("ready")
    expect(mapBflStatus("Error")).toBe("failed")
    expect(mapBflStatus("")).toBe("failed")
  })
})

describe("buildHeroPrompt", () => {
  test("hex marka rengi prompt'a gömülür (API alanı yok)", () => {
    expect(buildHeroPrompt({ sourceUrl: "a", prompt: "studio", brandHex: "#ff0055" })).toBe(
      "studio, brand accent color #ff0055"
    )
  })
  test("hex yoksa temiz prompt; prompt yoksa varsayılan", () => {
    expect(buildHeroPrompt({ sourceUrl: "a", prompt: "studio" })).toBe("studio")
    expect(buildHeroPrompt({ sourceUrl: "a" })).toContain("product hero shot")
  })
})

describe("toFluxBody", () => {
  test("input_image_N DÜZ alanları (dizi değil), source ilk", () => {
    const b = toFluxBody({ sourceUrl: "hero.png", refs: ["r1", "r2"] })
    expect(b.input_image).toBe("hero.png")
    expect(b.input_image_2).toBe("r1")
    expect(b.input_image_3).toBe("r2")
    expect(b.image_urls).toBeUndefined() // fal uydurması yok
    expect(b.brand_color).toBeUndefined() // BFL'de yok
    expect(b.output_format).toBe("png")
  })
  test("8 referans sınırı — source + refs toplam 8'de kırpılır", () => {
    const refs = Array.from({ length: 12 }, (_, i) => `r${i}`)
    const b = toFluxBody({ sourceUrl: "hero", refs })
    expect(b.input_image).toBe("hero")
    expect(b.input_image_8).toBeDefined()
    expect((b as any).input_image_9).toBeUndefined()
  })
})
