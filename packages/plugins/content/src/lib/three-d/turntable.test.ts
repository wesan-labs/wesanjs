import { describe, expect, test } from "bun:test"
import { orbitAngles } from "./turntable"

describe("orbitAngles", () => {
  test("varsayılan 72 kare, 5° aralık, 0→355", () => {
    const a = orbitAngles()
    expect(a.length).toBe(72)
    expect(a[0]).toEqual({ index: 0, azimuthDeg: 0 })
    expect(a[1].azimuthDeg).toBe(5)
    expect(a[71].azimuthDeg).toBe(355)
  })
  test("determinizm + özelleştirme (8 kare, 45°)", () => {
    const a = orbitAngles(8, 45)
    expect(a.map((x) => x.azimuthDeg)).toEqual([0, 45, 90, 135, 180, 225, 270, 315])
  })
})
