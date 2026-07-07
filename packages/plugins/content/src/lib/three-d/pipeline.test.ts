import { describe, expect, test } from "bun:test"
import { nextStep, sampleTimestamps } from "./pipeline"

describe("nextStep", () => {
  test("zincir sırası: hero→orbital→upscale→sample→done", () => {
    expect(nextStep("hero")).toBe("orbital")
    expect(nextStep("orbital")).toBe("upscale")
    expect(nextStep("upscale")).toBe("sample")
    expect(nextStep("sample")).toBe("done")
  })
  test("done terminal — kendine döner", () => {
    expect(nextStep("done")).toBe("done")
  })
})

describe("sampleTimestamps", () => {
  test("varsayılan 72 kare, [0,duration) eşit bölünür", () => {
    const t = sampleTimestamps(10, 72)
    expect(t.length).toBe(72)
    expect(t[0]).toBe(0)
    expect(t[36]).toBeCloseTo(5, 5) // yarı tur = yarı süre
    expect(t[71]).toBeCloseTo((71 * 10) / 72, 5)
  })
  test("özelleştirme: 8 kare / 8s → tam saniyeler", () => {
    expect(sampleTimestamps(8, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })
  test("geçersiz girdi → boş", () => {
    expect(sampleTimestamps(0)).toEqual([])
    expect(sampleTimestamps(10, 0)).toEqual([])
    expect(sampleTimestamps(-5)).toEqual([])
  })
})
