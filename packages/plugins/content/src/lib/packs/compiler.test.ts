/**
 * Compile-and-cache kanıtı (mimari v2 §2) — kredisiz, deterministik, ALAN-BAĞIMSIZ.
 * `bun test src/lib/packs`. Ezberci-öldüren tez: tek derleyici, herhangi bir alan,
 * kimse dikey-özel şablon yazmaz.
 */

import { describe, expect, test } from "bun:test"
import type { BrandIdentity } from "../brand/types"
import { compilePack } from "./compiler"
import { composeWithBrand, getCompiledPack } from "./loader"
import { composeInstruction } from "./template-engine"

const coffee: BrandIdentity = {
  id: "ember", tenantId: "t1", version: 1,
  name: "Ember Roasters",
  domain: "artisan coffee roastery",
  offering: "single-origin espresso beans",
  audience: "urban ritual-seekers 25-40",
  positioning: "craft, not commodity",
  voice: { formality: 30, energy: 60, warmth: 80, complexity: 50 },
  vocabulary: { neverUse: ["cheap", "instant"] },
  visual: {
    colors: { primary: "#3b2a20", accent: "#c9822f" },
    photographyStyle: "warm natural light, tactile surfaces",
    moodKeywords: ["warm", "unhurried"],
  },
}

// TAMAMEN farklı alan — aynı derleyici, dikey-özel kod YOK.
const dental: BrandIdentity = {
  id: "brightsmile", tenantId: "t2", version: 2,
  name: "BrightSmile Pediatric",
  domain: "pediatric dental clinic",
  offering: "gentle kids dental care",
  audience: "parents of young children",
  voice: { formality: 50, energy: 40, warmth: 90, complexity: 30 },
  visual: {
    colors: { primary: "#2ea6d8", accent: "#ffd23f" },
    photographyStyle: "bright clean studio",
    moodKeywords: ["friendly", "reassuring"],
  },
}

const compose = (brand: BrandIdentity, shotId: string, metadata: Record<string, string> = {}) =>
  composeInstruction(
    { packId: `brand-${brand.id}`, categoryId: "main", shotId, metadata },
    compilePack(brand),
    {} // resolverSet yok — direct-token (SUBJECT/AUDIENCE) + defaults
  )

describe("compilePack — yapı", () => {
  test("marka → geçerli PackDef, 5 intent shot, domain serbest metin (enum değil)", () => {
    const pack = compilePack(coffee)
    expect(pack.sector).toBe("artisan coffee roastery") // enum değil, serbest
    expect(pack.label).toBe("Ember Roasters")
    expect(Object.keys(pack.categories.main.shots)).toEqual([
      "hero", "lifestyle", "detail", "social-cover", "feature-callout",
    ])
    expect(pack.defaults).toEqual({
      SUBJECT: "single-origin espresso beans",
      AUDIENCE: "urban ritual-seekers 25-40",
    })
  })
})

describe("compile-and-cache — determinizm (kredisiz)", () => {
  test("aynı marka → 5 derleme+compose → byte-identical", () => {
    const outs = Array.from({ length: 5 }, () => compose(coffee, "hero", { SUBJECT: "espresso bag" }).instruction)
    for (const o of outs) expect(o).toBe(outs[0])
  })
})

describe("compose — marka pack'e derlendi", () => {
  test("fidelity marka kimliğini + paleti + neverUse'u başa bakar", () => {
    const { instruction } = compose(coffee, "hero", { SUBJECT: "espresso bag" })
    expect(instruction.startsWith("BRAND FIDELITY")).toBe(true)
    expect(instruction).toContain("Ember Roasters")
    expect(instruction).toContain("#3b2a20")
    expect(instruction).toContain("Avoid: cheap; instant")
    expect(instruction).toContain("espresso bag") // SUBJECT vision'dan
    expect(/\{[A-Z_]+\}/.test(instruction)).toBe(false) // token kalmadı
  })

  test("SUBJECT verilmezse marka offering default'u düşer (sessiz undefined değil)", () => {
    const { instruction } = compose(coffee, "hero")
    expect(instruction).toContain("single-origin espresso beans")
  })
})

describe("ALAN-BAĞIMSIZ — ezberci-öldüren tez", () => {
  test("diş kliniği AYNI derleyiciden geçer, dikey-özel kod yok", () => {
    const pack = compilePack(dental)
    expect(pack.sector).toBe("pediatric dental clinic")
    // aynı intent seti — kahveyle birebir aynı shot'lar
    expect(Object.keys(pack.categories.main.shots)).toEqual(
      Object.keys(compilePack(coffee).categories.main.shots)
    )
    const { instruction } = compose(dental, "social-cover", { SUBJECT: "smiling child at checkup" })
    expect(instruction).toContain("BrightSmile Pediatric")
    expect(instruction).toContain("#2ea6d8")
    expect(instruction).toContain("smiling child at checkup")
    expect(/\{[A-Z_]+\}/.test(instruction)).toBe(false)
  })

  test("iki alan farklı fidelity üretir (marka-koşullu, ezber değil)", () => {
    const a = compilePack(coffee).fidelity.global
    const b = compilePack(dental).fidelity.global
    expect(a).not.toBe(b)
    expect(a).toContain("Ember")
    expect(b).toContain("BrightSmile")
  })
})

describe("compile-and-cache — loader entegrasyonu (compose akışına bağlı)", () => {
  test("getCompiledPack aynı marka+version → aynı referansı döner (compile-once)", () => {
    const p1 = getCompiledPack(coffee)
    const p2 = getCompiledPack(coffee)
    expect(p2).toBe(p1) // cache hit — yeniden derlenmedi
  })

  test("version değişince yeniden derlenir (invalidate)", () => {
    const p1 = getCompiledPack(coffee)
    const p2 = getCompiledPack({ ...coffee, version: coffee.version + 1 })
    expect(p2).not.toBe(p1)
  })

  test("composeWithBrand = compiled pack üstünde composeInstruction", () => {
    const viaBrand = composeWithBrand(
      { packId: "x", categoryId: "main", shotId: "hero", metadata: { SUBJECT: "bag" } },
      coffee
    ).instruction
    const viaPack = composeInstruction(
      { packId: "x", categoryId: "main", shotId: "hero", metadata: { SUBJECT: "bag" } },
      compilePack(coffee),
      {}
    ).instruction
    expect(viaBrand).toBe(viaPack)
    expect(viaBrand).toContain("Ember Roasters")
  })
})
