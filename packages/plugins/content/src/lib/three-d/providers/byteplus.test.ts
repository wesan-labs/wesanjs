import { describe, expect, test } from "bun:test"
import { mapArkStatus, toSeedanceBody } from "./byteplus"

describe("mapArkStatus", () => {
  test("queued/running→processing, succeeded→ready, gerisi→failed", () => {
    expect(mapArkStatus("queued")).toBe("processing")
    expect(mapArkStatus("running")).toBe("processing")
    expect(mapArkStatus("succeeded")).toBe("ready")
    expect(mapArkStatus("failed")).toBe("failed")
    expect(mapArkStatus("expired")).toBe("failed")
    expect(mapArkStatus("cancelled")).toBe("failed")
  })
})

describe("toSeedanceBody", () => {
  test("hero=first_frame, refs=reference_image, prompt ilk", () => {
    const b = toSeedanceBody({ sourceUrl: "hero.png", refs: ["p1", "p2"] })
    const content = b.content as any[]
    expect(content[0]).toEqual({
      type: "text",
      text: "product rotates a full 360 degrees on a turntable, camera static, seamless loop",
    })
    expect(content[1]).toEqual({ type: "image_url", image_url: { url: "hero.png" }, role: "first_frame" })
    expect(content[2]).toEqual({ type: "image_url", image_url: { url: "p1" }, role: "reference_image" })
    expect(content[3].role).toBe("reference_image")
    expect(b.model).toBe("dreamina-seedance-2-0-260128")
  })
  test("ref yoksa sadece text + first_frame", () => {
    const content = toSeedanceBody({ sourceUrl: "h" }).content as any[]
    expect(content).toHaveLength(2)
  })
})
