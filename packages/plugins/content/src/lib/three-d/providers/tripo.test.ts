import { describe, expect, test } from "bun:test"
import { mapTripoStatus } from "./tripo"

describe("mapTripoStatus", () => {
  test("queued/running → processing", () => {
    expect(mapTripoStatus("queued")).toBe("processing")
    expect(mapTripoStatus("running")).toBe("processing")
  })
  test("success → ready; failed/unknown → failed", () => {
    expect(mapTripoStatus("success")).toBe("ready")
    expect(mapTripoStatus("failed")).toBe("failed")
    expect(mapTripoStatus("banned")).toBe("failed")
  })
})
