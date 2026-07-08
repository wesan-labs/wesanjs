import { describe, expect, test } from "bun:test"
import { mapBflStatus, toFluxBody } from "./bfl"

describe("mapBflStatus", () => {
  test("Pending→processing, Ready→ready, gerisi→failed", () => {
    expect(mapBflStatus("Pending")).toBe("processing")
    expect(mapBflStatus("Ready")).toBe("ready")
    expect(mapBflStatus("Error")).toBe("failed")
    expect(mapBflStatus("")).toBe("failed")
  })
})

describe("toFluxBody", () => {
  test("prompt = op-spec (marka rengi YOK), input_image_N düz alan", () => {
    const b = toFluxBody({ sourceUrl: "hero.png", refs: ["r1", "r2"] }, "clean studio hero", { output_format: "png" })
    expect(b.prompt).toBe("clean studio hero")
    expect(b.input_image).toBe("hero.png")
    expect(b.input_image_2).toBe("r1")
    expect(b.input_image_3).toBe("r2")
    expect(b.output_format).toBe("png")
    expect((b as any).brand_color).toBeUndefined() // §5b: marka prompt'ta YOK
    expect((b as any).image_urls).toBeUndefined() // fal uydurması yok
  })
  test("8 referans sınırı", () => {
    const refs = Array.from({ length: 12 }, (_, i) => `r${i}`)
    const b = toFluxBody({ sourceUrl: "hero", refs }, "x", {})
    expect(b.input_image_8).toBeDefined()
    expect((b as any).input_image_9).toBeUndefined()
  })
})
