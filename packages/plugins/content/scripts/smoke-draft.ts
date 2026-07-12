// @ts-nocheck — Bun dev script. Outcome-studio motoru (produceDraft) canlı doğrulama.
// Kullanım: helm dizininden GEMINI_API_KEY ile: bun run <bu> /tmp/couch.png
import { produceDraft } from "/Users/canakyuz/Developer/wesan/levios/wesanjs/packages/plugins/content/src/lib/media/studio-draft"

const src = process.argv[2] ?? "/tmp/couch.png"
const buf = Buffer.from(await Bun.file(src).arrayBuffer())
const img = { mime: "image/png", data: buf.toString("base64") }

console.log("produceDraft →", src)
const t0 = Date.now()
const draft = await produceDraft([img], "Koltuk")
const sec = ((Date.now() - t0) / 1000).toFixed(0)
console.log(`✔ ${sec}sn`)
console.log("hero:", draft.heroImage.slice(0, 50), `(${draft.heroImage.length} char)`)
console.log("açıklama:", draft.description)
console.log("caption:", draft.caption)
// heroyu kaydet ki bakılabilsin
if (draft.heroImage.startsWith("data:")) {
  const b64 = draft.heroImage.slice(draft.heroImage.indexOf(",") + 1)
  await Bun.write("/tmp/draft-hero.png", Buffer.from(b64, "base64"))
  console.log("hero kaydedildi: /tmp/draft-hero.png")
}
