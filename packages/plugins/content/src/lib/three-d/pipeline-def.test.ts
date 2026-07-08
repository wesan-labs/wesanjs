import { describe, expect, test } from "bun:test"
import { DEFAULT_PIPELINE, descriptorFor, nextOp, OPERATIONS } from "./pipeline-def"

describe("nextOp", () => {
  test("lineer zincir: hero→orbital→upscale→null", () => {
    expect(nextOp(DEFAULT_PIPELINE, "hero")?.op).toBe("orbital")
    expect(nextOp(DEFAULT_PIPELINE, "orbital")?.op).toBe("upscale")
    expect(nextOp(DEFAULT_PIPELINE, "upscale")).toBeNull()
    expect(nextOp(DEFAULT_PIPELINE, "yok")).toBeNull()
  })
})

describe("descriptorFor", () => {
  test("op → descriptor (provider + params)", () => {
    expect(descriptorFor(DEFAULT_PIPELINE, "hero")?.provider).toBe("bfl")
    expect(descriptorFor(DEFAULT_PIPELINE, "orbital")?.params.resolution).toBe("720p")
    expect(descriptorFor(DEFAULT_PIPELINE, "yok")).toBeUndefined()
  })
})

describe("OPERATIONS", () => {
  test("op-spec sabit: hero/orbital var, upscale prompt YOK", () => {
    expect(OPERATIONS.hero.opSpec).toContain("studio")
    expect(OPERATIONS.orbital.opSpec).toContain("360")
    expect(OPERATIONS.upscale.opSpec).toBeNull()
  })
})
