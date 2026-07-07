import { describe, expect, test } from "bun:test"
import { envKeyFor, outputColumnFor, stepInputFor } from "./step-registry"

describe("stepInputFor", () => {
  test("hero: foto[0]=source, kalanı ref", () => {
    expect(stepInputFor("hero", { inputs: ["a", "b", "c"] })).toEqual({
      sourceUrl: "a",
      refs: ["b", "c"],
      brandHex: undefined,
    })
  })
  test("orbital: hero=source, ürün foto'ları=kimlik ref", () => {
    expect(stepInputFor("orbital", { inputs: ["a", "b"], hero_url: "h.png" })).toEqual({
      sourceUrl: "h.png",
      refs: ["a", "b"],
    })
  })
  test("upscale: orbital video=source", () => {
    expect(stepInputFor("upscale", { inputs: [], video_url: "v.mp4" })).toEqual({ sourceUrl: "v.mp4" })
  })
})

describe("outputColumnFor", () => {
  test("hero→hero_url, orbital/upscale→video_url, done→null", () => {
    expect(outputColumnFor("hero")).toBe("hero_url")
    expect(outputColumnFor("orbital")).toBe("video_url")
    expect(outputColumnFor("upscale")).toBe("video_url")
    expect(outputColumnFor("done")).toBeNull()
  })
})

describe("envKeyFor", () => {
  test("adım → env key adı", () => {
    expect(envKeyFor("hero")).toBe("BFL_API_KEY")
    expect(envKeyFor("orbital")).toBe("ARK_API_KEY")
    expect(envKeyFor("upscale")).toBe("WAVESPEED_API_KEY")
    expect(envKeyFor("done")).toBeNull()
  })
})
