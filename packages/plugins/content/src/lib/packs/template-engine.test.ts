/**
 * Pack Engine — determinism & correctness (mimari spec §11, task #0011 Faz 1 ★).
 * Kredisiz koşar: `bun test src/lib/packs`. LLM/Gemini yok, saf kompozisyon.
 */

import { describe, expect, test } from "bun:test"
import { compose } from "./loader"
import { ComposeError, type FillInput } from "./types"

const GLOBAL_PREFIX_START = "CRITICAL: The generated furniture must be an EXACT replica"
const LEFTOVER_TOKEN = /\{[A-Z0-9_]+\}/

const zigonWalnut: FillInput = {
  packId: "begahome-furniture",
  categoryId: "zigon",
  shotId: "lifestyle",
  metadata: { color: "walnut", legs: "tapered", style: "classic", name: "Klasik Zigon Sehpa" },
}

describe("compose — determinism (★ milestone)", () => {
  test("aynı input → 10 çağrı → byte-identical instruction", () => {
    const outputs = Array.from({ length: 10 }, () => compose(zigonWalnut).instruction)
    const first = outputs[0]
    for (const o of outputs) expect(o).toBe(first)
  })

  test("farklı obje referansı, aynı değer → aynı instruction", () => {
    const a = compose(zigonWalnut).instruction
    const b = compose({
      packId: "begahome-furniture",
      categoryId: "zigon",
      shotId: "lifestyle",
      metadata: { color: "walnut", legs: "tapered", style: "classic", name: "Klasik Zigon Sehpa" },
    }).instruction
    expect(b).toBe(a)
  })
})

describe("compose — doğru kompozisyon", () => {
  test("fidelity.global başa eklenir", () => {
    expect(compose(zigonWalnut).instruction.startsWith(GLOBAL_PREFIX_START)).toBe(true)
  })

  test("token'lar resolver ile çözülür (walnut/tapered/three/beige linen)", () => {
    const { instruction } = compose(zigonWalnut)
    expect(instruction).toContain(
      "A set of three walnut nesting tables with tapered conical legs"
    )
    expect(instruction).toContain("beside a beige linen sofa")
  })

  test("çözülmemiş {TOKEN} kalmaz", () => {
    expect(LEFTOVER_TOKEN.test(compose(zigonWalnut).instruction)).toBe(false)
  })

  test("mode + meta doğru döner", () => {
    const out = compose(zigonWalnut)
    expect(out.mode).toBe("transform")
    expect(out.meta).toEqual({
      packId: "begahome-furniture",
      categoryId: "zigon",
      shotId: "lifestyle",
      templateVersion: "1.0.0",
    })
  })
})

describe("getNestCount — bug fix (çıplak '4' → '4lü' daraltması)", () => {
  const withName = (name: string) =>
    compose({ ...zigonWalnut, metadata: { ...zigonWalnut.metadata, name } }).instruction

  test("'4'lü' → four", () => {
    expect(withName("Zigon Sehpa 4'lü Takım")).toContain("A set of four walnut nesting tables")
  })
  test("'4lü' → four", () => {
    expect(withName("4lü Zigon")).toContain("A set of four walnut nesting tables")
  })
  test("'Model 41' → three (eski bug artık yok)", () => {
    expect(withName("Zigon Model 41")).toContain("A set of three walnut nesting tables")
  })
})

describe("compose — style directive override", () => {
  test("aspect/concept eklenir; determinizm korunur", () => {
    const styled = { ...zigonWalnut, style: { aspect: "4:5", concept: "nordic minimal" } }
    const a = compose(styled).instruction
    const b = compose(styled).instruction
    expect(a).toBe(b)
    expect(a).toContain("composition/aspect: 4:5")
    expect(a).toContain("visual concept & cultural aesthetic: nordic minimal")
  })

  test("style yoksa directive eklenmez", () => {
    expect(compose(zigonWalnut).instruction).not.toContain("Additionally you MUST apply")
  })
})

describe("compose — hata yolları (deny, sessiz fallback yok)", () => {
  test("bilinmeyen pack → ComposeError", () => {
    expect(() => compose({ ...zigonWalnut, packId: "nope" })).toThrow(ComposeError)
  })
  test("bilinmeyen category → ComposeError", () => {
    expect(() => compose({ ...zigonWalnut, categoryId: "nope" })).toThrow(ComposeError)
  })
  test("bilinmeyen shot → ComposeError", () => {
    expect(() => compose({ ...zigonWalnut, shotId: "nope" })).toThrow(ComposeError)
  })
  test("eksik metadata (color yok) → sessiz 'undefined' değil, ComposeError", () => {
    expect(() =>
      compose({ ...zigonWalnut, metadata: { legs: "tapered", style: "classic", name: "x" } })
    ).toThrow(ComposeError)
  })
})

describe("compose — engine generic mi (furniture'a hardcode değil)", () => {
  test("furniture 6 kategori × 4 shot hepsi compose olur, token kalmaz", () => {
    const cats = ["zigon", "orta", "c-sehpa", "kanepe", "berjer", "kose"]
    const shots = ["lifestyle", "angle", "detail", "usage"]
    for (const categoryId of cats) {
      for (const shotId of shots) {
        const { instruction } = compose({
          packId: "begahome-furniture",
          categoryId,
          shotId,
          metadata: { color: "walnut", legs: "tapered", style: "classic", name: "Test 4'lü" },
        })
        expect(LEFTOVER_TOKEN.test(instruction)).toBe(false)
        expect(instruction.startsWith(GLOBAL_PREFIX_START)).toBe(true)
      }
    }
  })
})

describe("mobile-game pack — direct-token (resolver YOK), 2. sektör kanıtı", () => {
  const heroMeta = {
    GAME_NAME: "Idle Tycoon Empire",
    GAME_GENRE: "idle tycoon",
    GAME_ART_STYLE: "stylized 3D low-poly, vibrant cartoon",
    GAME_HERO: "cheerful cartoon tycoon boss",
    GAME_MOOD: "fun, energetic",
  }
  const hero: FillInput = {
    packId: "mobile-game-ua",
    categoryId: "key-art",
    shotId: "hero",
    metadata: heroMeta,
  }

  test("resolver'sız direct token metadata'dan çözülür (determinist)", () => {
    const a = compose(hero).instruction
    const b = compose({ ...hero, metadata: { ...heroMeta } }).instruction
    expect(a).toBe(b)
    expect(a).toContain("cheerful cartoon tycoon boss in a vibrant idle tycoon game world for Idle Tycoon Empire")
    expect(LEFTOVER_TOKEN.test(a)).toBe(false)
  })

  test("generate mode + furniture GLOBAL_PREFIX'i YOK (pack izolasyonu)", () => {
    const out = compose(hero)
    expect(out.mode).toBe("generate")
    expect(out.instruction.startsWith(GLOBAL_PREFIX_START)).toBe(false)
    // boş fidelity.global → leading space yok
    expect(out.instruction.startsWith(" ")).toBe(false)
  })

  test("transform shot (senin ekranın) — mode transform, headline gömülü", () => {
    const out = compose({
      packId: "mobile-game-ua",
      categoryId: "ua-ad",
      shotId: "story",
      metadata: { GAME_GENRE: "idle tycoon", GAME_HEADLINE: "Build your empire!" },
    })
    expect(out.mode).toBe("transform")
    expect(out.instruction).toContain('reading "Build your empire!"')
    expect(LEFTOVER_TOKEN.test(out.instruction)).toBe(false)
  })

  test("8 shot (5 kategori) hepsi compose olur, token kalmaz", () => {
    const full = {
      GAME_NAME: "X", GAME_GENRE: "idle", GAME_ART_STYLE: "cartoon",
      GAME_HERO: "boss", GAME_MOOD: "fun", GAME_HEADLINE: "Play!",
    }
    const shots: [string, string][] = [
      ["key-art", "hero"], ["aso-screenshot", "mockup"], ["aso-screenshot", "callout"],
      ["aso-screenshot", "carousel"], ["app-icon", "default"], ["feature-graphic", "default"],
      ["ua-ad", "story"], ["ua-ad", "tiktok"],
    ]
    for (const [categoryId, shotId] of shots) {
      const { instruction } = compose({ packId: "mobile-game-ua", categoryId, shotId, metadata: full })
      expect(LEFTOVER_TOKEN.test(instruction)).toBe(false)
    }
  })
})
