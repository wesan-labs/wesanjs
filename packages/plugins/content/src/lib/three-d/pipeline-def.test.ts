import { describe, expect, test } from "bun:test"
import { DEFAULT_PIPELINE, descriptorFor, nextOp, OPERATIONS, type PipelineStepDescriptor } from "./pipeline-def"

// Genel nextOp davranışı — pipeline'dan bağımsız (data-driven).
const CHAIN: PipelineStepDescriptor[] = [
  { op: "hero", provider: "bfl", params: {} },
  { op: "orbital", provider: "wavespeed-seedance", params: {} },
  { op: "upscale", provider: "wavespeed", params: {} },
]

describe("nextOp (data-driven)", () => {
  test("lineer zincirde sıradaki; son→null", () => {
    expect(nextOp(CHAIN, "hero")?.op).toBe("orbital")
    expect(nextOp(CHAIN, "upscale")).toBeNull()
    expect(nextOp(CHAIN, "yok")).toBeNull()
  })
})

describe("DEFAULT_PIPELINE — GLB-direct (2026-07-10)", () => {
  test("tek adım: reconstruct / runware / GLB (video zinciri kaldırıldı)", () => {
    expect(DEFAULT_PIPELINE).toHaveLength(1)
    expect(DEFAULT_PIPELINE[0].op).toBe("reconstruct")
    expect(DEFAULT_PIPELINE[0].provider).toBe("runware")
    expect(DEFAULT_PIPELINE[0].params.outputFormat).toBe("GLB")
    expect(nextOp(DEFAULT_PIPELINE, "reconstruct")).toBeNull() // tek adım → done
  })
  test("descriptorFor", () => {
    expect(descriptorFor(DEFAULT_PIPELINE, "reconstruct")?.provider).toBe("runware")
    expect(descriptorFor(DEFAULT_PIPELINE, "hero")).toBeUndefined()
  })
})

describe("OPERATIONS", () => {
  test("reconstruct prompt YOK; hero/orbital op-spec var", () => {
    expect(OPERATIONS.reconstruct.opSpec).toBeNull()
    expect(OPERATIONS.hero.opSpec).toContain("studio")
    expect(OPERATIONS.orbital.opSpec).toContain("360")
  })
})
