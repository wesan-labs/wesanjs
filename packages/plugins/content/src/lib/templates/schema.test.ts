import { describe, expect, test } from "bun:test"
import { validateTemplate } from "./schema"

const valid = {
  id: "t1", kind: "image", format: "ig-post-1x1", label: "Basit",
  scene: { width: 1080, height: 1080, nodes: [
    { type: "Text", id: "n1", slotId: "s-head", attrs: { x: 40, y: 40, text: "" } },
  ] },
  slots: [{ id: "s-head", bind: { kind: "text", role: "headline" } }],
}

describe("validateTemplate", () => {
  test("geçerli template geçer", () => {
    expect(validateTemplate(valid).id).toBe("t1")
  })
  test("eksik scene reddedilir", () => {
    expect(() => validateTemplate({ ...valid, scene: undefined })).toThrow()
  })
  test("bilinmeyen slot bind reddedilir", () => {
    const bad = { ...valid, slots: [{ id: "s", bind: { kind: "nope" } }] }
    expect(() => validateTemplate(bad)).toThrow()
  })
})
