import { describe, expect, test } from "bun:test"
import { mapWaveSpeedStatus, toSeedanceWsBody, toUpscaleBody } from "./wavespeed"

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
  test("video = kaynak mp4, target_resolution = params", () => {
    expect(toUpscaleBody({ sourceUrl: "orbital.mp4" }, { target_resolution: "4k" })).toEqual({
      video: "orbital.mp4",
      target_resolution: "4k",
    })
  })
})

describe("toSeedanceWsBody", () => {
  test("image=hero, prompt=op-spec, params (audio kapalı)", () => {
    expect(
      toSeedanceWsBody({ sourceUrl: "hero.png" }, "orbit, camera static", {
        resolution: "720p",
        aspect_ratio: "1:1",
        duration: 5,
      })
    ).toEqual({
      prompt: "orbit, camera static",
      image: "hero.png",
      aspect_ratio: "1:1",
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    })
  })
})
