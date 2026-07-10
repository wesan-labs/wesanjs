import { describe, expect, test } from "bun:test"
import { mapRunwareStatus, toReconstructTask } from "./runware"

describe("mapRunwareStatus", () => {
  test("success→ready, processing/pending→processing, gerisi→failed", () => {
    expect(mapRunwareStatus("success")).toBe("ready")
    expect(mapRunwareStatus("processing")).toBe("processing")
    expect(mapRunwareStatus("pending")).toBe("processing")
    expect(mapRunwareStatus("error")).toBe("failed")
    expect(mapRunwareStatus(undefined)).toBe("failed")
  })
})

describe("toReconstructTask", () => {
  test("3dInference task: images (data-URI kabul), GLB, 4 sınırı", () => {
    const t = toReconstructTask(
      { sourceUrl: "data:image/png;base64,AAA", refs: ["u1", "u2", "u3", "u4"] },
      { model: "tripo:v3.1@0", outputFormat: "GLB" },
      "uuid-1"
    )
    expect(t.taskType).toBe("3dInference")
    expect(t.taskUUID).toBe("uuid-1")
    expect(t.model).toBe("tripo:v3.1@0")
    expect(t.outputFormat).toBe("GLB")
    expect((t.inputs as any).images).toEqual(["data:image/png;base64,AAA", "u1", "u2", "u3"]) // 4 sınırı
  })
})
