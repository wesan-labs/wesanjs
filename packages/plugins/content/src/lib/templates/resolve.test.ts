import { describe, expect, test } from "bun:test"
import { resolveScene } from "./resolve"
import type { Template, FillData } from "./types"

const tpl: Template = {
  id: "t", kind: "image", format: "ig-post-1x1", label: "x",
  scene: { width: 1080, height: 1080, background: "#fff", nodes: [
    { type: "Text", id: "n1", slotId: "head", attrs: { x: 40, y: 40, text: "", fill: "#000", fontFamily: "Arial" } },
    { type: "Rect", id: "n2", slotId: "bg", attrs: { x: 0, y: 0, width: 1080, height: 200, fill: "#eee" } },
    { type: "Text", id: "n3", attrs: { x: 40, y: 900, text: "sabit" } },
  ] },
  slots: [
    { id: "head", bind: { kind: "text", role: "headline" } },
    { id: "bg", bind: { kind: "color", role: "primary" } },
  ],
}

const fill: FillData = {
  head: { kind: "text", value: "Merhaba" },
  bg: { kind: "color", value: "#3b2a20" },
}

describe("resolveScene", () => {
  test("text slot → text attr; color slot → fill attr; sabit node dokunulmaz", () => {
    const s = resolveScene(tpl, fill)
    expect((s.nodes[0].attrs as any).text).toBe("Merhaba")
    expect((s.nodes[1].attrs as any).fill).toBe("#3b2a20")
    expect((s.nodes[2].attrs as any).text).toBe("sabit")
  })
  test("determinizm: 2 çağrı byte-identical", () => {
    expect(JSON.stringify(resolveScene(tpl, fill))).toBe(JSON.stringify(resolveScene(tpl, fill)))
  })
  test("eksik slot fill → TemplateError", () => {
    expect(() => resolveScene(tpl, { head: { kind: "text", value: "x" } })).toThrow()
  })
})
