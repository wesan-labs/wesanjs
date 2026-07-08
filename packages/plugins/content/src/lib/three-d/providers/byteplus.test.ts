import { describe, expect, test } from "bun:test"
import { mapArkStatus, toSeedanceBody } from "./byteplus"

describe("mapArkStatus", () => {
  test("queued/running→processing, succeeded→ready, gerisi→failed", () => {
    expect(mapArkStatus("queued")).toBe("processing")
    expect(mapArkStatus("running")).toBe("processing")
    expect(mapArkStatus("succeeded")).toBe("ready")
    expect(mapArkStatus("failed")).toBe("failed")
    expect(mapArkStatus("expired")).toBe("failed")
  })
})

describe("toSeedanceBody", () => {
  test("text=op-spec, hero=first_frame, refs=reference_image, params", () => {
    const b = toSeedanceBody({ sourceUrl: "hero.png", refs: ["p1", "p2"] }, "orbit, camera static", {
      model: "m",
      ratio: "1:1",
      resolution: "720p",
      duration: 5,
    })
    const content = b.content as any[]
    expect(content[0]).toEqual({ type: "text", text: "orbit, camera static" })
    expect(content[1]).toEqual({ type: "image_url", image_url: { url: "hero.png" }, role: "first_frame" })
    expect(content[2].role).toBe("reference_image")
    expect(content[3].role).toBe("reference_image")
    expect(b.model).toBe("m")
    expect(b.ratio).toBe("1:1")
    expect(b.duration).toBe(5)
  })
})
