import { describe, expect, test } from "bun:test"
import { buildFillData } from "./fill"
import { resolveScene } from "./resolve"
import { getTemplate } from "./loader"
import type { BrandIdentity } from "../brand/types"

const brand: BrandIdentity = {
  id: "b", tenantId: "t", version: 1,
  name: "Terra Kahve", tagline: "Sabahın ilk ritüeli", domain: "artisan kahve kavurucusu",
  offering: "tek köken çekirdek", audience: "ritüel-seven şehirliler",
  positioning: "Küçük partiler halinde kavrulan tek köken çekirdekler",
  voice: { formality: 40, energy: 50, warmth: 70, complexity: 40 },
  visual: { colors: { primary: "#112233", accent: "#aa0000" } },
}

describe("buildFillData", () => {
  const tpl = getTemplate("ig-post-minimal")!

  test("her slot için fill üretir (resolve throw etmez)", () => {
    const fill = buildFillData(tpl, brand)
    expect(() => resolveScene(tpl, fill)).not.toThrow()
    expect(Object.keys(fill).sort()).toEqual(tpl.slots.map((s) => s.id).sort())
  })

  test("color slot brand rengini alır (authored'ı override eder); headline tagline'ı alır", () => {
    const fill = buildFillData(tpl, brand)
    expect(fill["primary"]).toEqual({ kind: "color", value: "#112233" }) // authored #3b2a20 değil
    expect(fill["accent"]).toEqual({ kind: "color", value: "#aa0000" })
    expect(fill["headline"]).toEqual({ kind: "text", value: "Sabahın ilk ritüeli" })
  })

  test("determinizm: 2 çağrı byte-identical", () => {
    expect(JSON.stringify(buildFillData(tpl, brand))).toBe(JSON.stringify(buildFillData(tpl, brand)))
  })

  test("geçersiz/eksik marka rengi → template authored renk korunur", () => {
    const noColor: BrandIdentity = { ...brand, visual: { colors: { primary: "brand color palette" } } }
    const fill = buildFillData(tpl, noColor)
    expect(fill["primary"].value).toBe("#3b2a20") // template band authored fill
    expect(fill["accent"].value).toBe("#c2703d") // template cta-bg authored fill
  })
})
