import { describe, expect, test } from "bun:test"
import { mapWaveSpeedStatus, toUpscaleBody } from "./wavespeed"

describe("mapWaveSpeedStatus", () => {
  test("created/processing→processing, completed→ready, failed→failed", () => {
    expect(mapWaveSpeedStatus("created")).toBe("processing")
    expect(mapWaveSpeedStatus("processing")).toBe("processing")
    expect(mapWaveSpeedStatus("completed")).toBe("ready")
    expect(mapWaveSpeedStatus("failed")).toBe("failed")
    expect(mapWaveSpeedStatus("")).toBe("failed")
  })
})

describe("toUpscaleBody", () => {
  test("video = kaynak mp4, target_resolution = 4k", () => {
    expect(toUpscaleBody({ sourceUrl: "orbital.mp4" })).toEqual({
      video: "orbital.mp4",
      target_resolution: "4k",
    })
  })
})
