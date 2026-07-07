import { describe, expect, test } from "bun:test"
import { listTemplates, recommendTemplates } from "./loader"
import { validateTemplate } from "./schema"
import { resolveScene } from "./resolve"
import type { FillData, Template } from "./types"

// her slot için sahte bir fill üret (kredisiz doğrulama)
const fullFill = (t: Template): FillData => {
  const fill: FillData = {}
  for (const s of t.slots) {
    if (s.bind.kind === "text") fill[s.id] = { kind: "text", value: "x" }
    else if (s.bind.kind === "color") fill[s.id] = { kind: "color", value: "#123456" }
    else if (s.bind.kind === "font") fill[s.id] = { kind: "font", value: "Arial" }
    else fill[s.id] = { kind: "image", value: "data:," }
  }
  return fill
}

// sahnedeki tüm slotId'leri topla (children dahil)
const slotIdsInScene = (t: Template): string[] => {
  const ids: string[] = []
  const walk = (n: { slotId?: string; children?: any[] }) => {
    if (n.slotId) ids.push(n.slotId)
    n.children?.forEach(walk)
  }
  t.scene.nodes.forEach(walk)
  return ids
}

describe("kürlenmiş kütüphane", () => {
  const templates = listTemplates()

  test("en az 3 template var", () => {
    expect(templates.length).toBeGreaterThanOrEqual(3)
  })

  test("hepsi şemadan geçer", () => {
    for (const t of templates) expect(() => validateTemplate(t)).not.toThrow()
  })

  test("referans bütünlüğü: her node.slotId bir slot'a karşılık gelir", () => {
    for (const t of templates) {
      const slotIds = new Set(t.slots.map((s) => s.id))
      for (const id of slotIdsInScene(t)) expect(slotIds.has(id)).toBe(true)
    }
  })

  test("hepsi tam fill ile resolve olur (TemplateError yok)", () => {
    for (const t of templates) expect(() => resolveScene(t, fullFill(t))).not.toThrow()
  })
})

describe("recommendTemplates", () => {
  test("domain eşleşen template öne çıkar", () => {
    const ranked = recommendTemplates({ domain: "artisan kahve cafe" })
    expect(ranked[0].id).toBe("ig-post-minimal") // domainTags: cafe, food-beverage
  })

  test("saas domain → og-wide öne çıkar", () => {
    const ranked = recommendTemplates({ domain: "b2b saas platform" })
    expect(ranked[0].id).toBe("og-wide")
  })

  test("boş domain → hepsi döner, deterministik sıra", () => {
    const a = recommendTemplates({})
    const b = recommendTemplates({})
    expect(a.length).toBe(listTemplates().length)
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id))
  })
})
