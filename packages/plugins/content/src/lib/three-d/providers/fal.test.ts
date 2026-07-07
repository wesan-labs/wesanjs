import { describe, expect, test } from "bun:test"
import { capRefs, mapFalStatus } from "./fal"

describe("mapFalStatus", () => {
  test("IN_QUEUE/IN_PROGRESS → processing", () => {
    expect(mapFalStatus("IN_QUEUE")).toBe("processing")
    expect(mapFalStatus("IN_PROGRESS")).toBe("processing")
  })
  test("COMPLETED → ready; diğer → failed", () => {
    expect(mapFalStatus("COMPLETED")).toBe("ready")
    expect(mapFalStatus("ERROR")).toBe("failed")
    expect(mapFalStatus("")).toBe("failed")
  })
})

describe("capRefs", () => {
  test("10 referans sınırı — fazlası kırpılır", () => {
    const many = Array.from({ length: 15 }, (_, i) => `img${i}`)
    expect(capRefs(many)).toHaveLength(10)
    expect(capRefs(many)[9]).toBe("img9")
  })
  test("sınır altı değişmez; özel max", () => {
    expect(capRefs(["a", "b"])).toEqual(["a", "b"])
    expect(capRefs(["a", "b", "c"], 2)).toEqual(["a", "b"])
  })
})
