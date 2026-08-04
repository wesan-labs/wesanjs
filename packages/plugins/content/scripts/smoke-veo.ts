// @ts-nocheck — Bun-runtime dev script; tsc kapsamı dışı.
/**
 * Veo premise testi — Gemini API image→video (360° ürün). Elimizdeki GEMINI_API_KEY.
 * predictLongRunning → operation poll → generatedSamples[0].video.uri.
 * Kullanım: GEMINI_API_KEY=... bun run scripts/smoke-veo.ts <img> [model]
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta"
const key = process.env.GEMINI_API_KEY
if (!key) { console.error("GEMINI_API_KEY yok"); process.exit(1) }
const src = process.argv[2]
const model = process.argv[3] || "veo-3.1-generate-preview"
if (!src) { console.error("kullanım: smoke-veo.ts <img> [model]"); process.exit(1) }

const toB64 = async (s: string): Promise<{ data: string; mime: string }> => {
  if (s.startsWith("data:")) {
    const [meta, b64] = s.split(",")
    return { data: b64, mime: meta.slice(5, meta.indexOf(";")) || "image/png" }
  }
  if (s.startsWith("http")) {
    const r = await fetch(s); const buf = Buffer.from(await r.arrayBuffer())
    return { data: buf.toString("base64"), mime: r.headers.get("content-type")?.split(";")[0] ?? "image/png" }
  }
  const buf = Buffer.from(await Bun.file(s).arrayBuffer())
  return { data: buf.toString("base64"), mime: "image/png" }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  const img = await toB64(src)
  console.log(`submit → Veo (${model})`)
  const res = await fetch(`${BASE}/models/${model}:predictLongRunning?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{
        prompt: "The product rotates a full 360 degrees on a turntable, camera static, clean studio, seamless loop.",
        image: { bytesBase64Encoded: img.data, mimeType: img.mime },
      }],
      parameters: { aspectRatio: "16:9" },
    }),
  })
  const json: any = await res.json()
  console.log("create:", JSON.stringify({ name: json?.name, error: json?.error?.message }).slice(0, 400))
  if (!res.ok || !json?.name) process.exit(1)

  for (let i = 0; i < 60; i++) {
    await sleep(8000)
    const op: any = await (await fetch(`${BASE}/${json.name}?key=${key}`)).json()
    if (!op?.done) { console.log(`poll ${i}: işleniyor…`); continue }
    const uri = op?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
    if (uri) {
      await Bun.write("./veo-out.mp4", await (await fetch(`${uri}&key=${key}`)).arrayBuffer())
      console.log("✔ video indirildi: ./veo-out.mp4 — aç ve kaliteye bak")
    } else {
      console.log("SONUÇ (uri yok):", JSON.stringify(op).slice(0, 500))
    }
    process.exit(uri ? 0 : 2)
  }
  console.log("TIMEOUT")
}
main()
