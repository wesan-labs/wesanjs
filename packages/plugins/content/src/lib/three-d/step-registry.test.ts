import { describe, expect, test } from "bun:test"
import { envKeyFor, outputColumnFor, stepInputFor } from "./step-registry"

describe("stepInputFor", () => {
  test("hero: foto[0]=source, kalanı ref (op-spec/params YOK)", () => {
    expect(stepInputFor("hero", { inputs: ["a", "b", "c"] })).toEqual({ sourceUrl: "a", refs: ["b", "c"] })
  })
  test("orbital: hero=source, ref YOK (1.5: first_frame+ref karıştırılamaz)", () => {
    expect(stepInputFor("orbital", { inputs: ["a", "b"], hero_url: "h.png" })).toEqual({
      sourceUrl: "h.png",
    })
  })
  test("upscale: orbital video=source", () => {
    expect(stepInputFor("upscale", { inputs: [], video_url: "v.mp4" })).toEqual({ sourceUrl: "v.mp4" })
  })
})

describe("stepInputFor · reconstruct", () => {
  test("ürün foto(ları) → GLB girdisi", () => {
    expect(stepInputFor("reconstruct", { inputs: ["a", "b"] })).toEqual({ sourceUrl: "a", refs: ["b"] })
  })
})

describe("outputColumnFor", () => {
  test("reconstruct→mesh_url, hero→hero_url, orbital/upscale→video_url, done→null", () => {
    expect(outputColumnFor("reconstruct")).toBe("mesh_url")
    expect(outputColumnFor("hero")).toBe("hero_url")
    expect(outputColumnFor("orbital")).toBe("video_url")
    expect(outputColumnFor("upscale")).toBe("video_url")
    expect(outputColumnFor("done")).toBeNull()
  })
})

describe("envKeyFor", () => {
  test("provider → env key adı", () => {
    expect(envKeyFor("runware")).toBe("RUNWARE_API_KEY")
    expect(envKeyFor("bfl")).toBe("BFL_API_KEY")
    expect(envKeyFor("byteplus")).toBe("ARK_API_KEY")
    expect(envKeyFor("wavespeed")).toBe("WAVESPEED_API_KEY")
    expect(envKeyFor("yok")).toBeNull()
  })
})
