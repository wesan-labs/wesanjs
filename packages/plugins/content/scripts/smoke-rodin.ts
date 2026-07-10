// @ts-nocheck — Bun-runtime dev script (Bun.file/Bun.write); tsc kapsamı dışı.
/**
 * GLB premise testi — Hyper3D Rodin Gen-2 (image→GLB). Sözleşme doğrulandı
 * (developer.hyper3d.ai llms-full, 2026-07-09): multipart, images=dosya bytes
 * (URL/host GEREKMEZ → data-URL/local dosya doğrudan yüklenir).
 *
 * Kullanım: RODIN_API_KEY=... bun run scripts/smoke-rodin.ts <img1> [img2 ...]
 *   <img> = yerel dosya yolu VEYA data:...;base64,... VEYA http(s) URL
 * Çıktı: ./rodin-<uuid>.glb (aç → model-viewer / Blender / macOS Preview ile bak).
 */
const API = "https://api.hyper3d.com/api/v2"
const key = process.env.RODIN_API_KEY
if (!key) {
  console.error("RODIN_API_KEY yok")
  process.exit(1)
}
const args = process.argv.slice(2)
if (!args.length) {
  console.error("kullanım: smoke-rodin.ts <img1> [img2 ...]")
  process.exit(1)
}

/** Girdiyi (dosya|data-URL|http) → Blob. */
const toBlob = async (src: string): Promise<Blob> => {
  if (src.startsWith("data:")) {
    const [meta, b64] = src.split(",")
    const mime = meta.slice(5, meta.indexOf(";")) || "image/png"
    return new Blob([Buffer.from(b64, "base64")], { type: mime })
  }
  if (src.startsWith("http")) {
    return await (await fetch(src)).blob()
  }
  return new Blob([await Bun.file(src).arrayBuffer()], { type: "image/png" })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  const form = new FormData()
  form.append("tier", "Gen-2")
  form.append("geometry_file_format", "glb")
  form.append("material", "PBR")
  form.append("quality", "high")
  let i = 0
  for (const a of args.slice(0, 5)) {
    form.append("images", await toBlob(a), `img${i++}.png`)
  }

  console.log(`submit → Rodin Gen-2 (${Math.min(args.length, 5)} görsel)`)
  const res = await fetch(`${API}/rodin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })
  const json: any = await res.json()
  const uuid = json?.uuid
  const subKey = json?.jobs?.subscription_key
  console.log("create:", JSON.stringify({ uuid, subKey, error: json?.error, message: json?.message }).slice(0, 400))
  if (!res.ok || !uuid || !subKey) process.exit(1)

  for (let t = 0; t < 120; t++) {
    await sleep(5000)
    const s: any = await (
      await fetch(`${API}/status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_key: subKey }),
      })
    ).json()
    const jobs: any[] = s?.jobs ?? []
    const st = jobs.map((j) => j.status).join(",")
    console.log(`poll ${t}: ${st || JSON.stringify(s).slice(0, 120)}`)
    if (jobs.length && jobs.every((j) => j.status === "Done")) break
    if (jobs.some((j) => j.status === "Failed")) {
      console.error("FAILED")
      process.exit(2)
    }
  }

  const dl: any = await (
    await fetch(`${API}/download`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ task_uuid: uuid }),
    })
  ).json()
  const list: any[] = dl?.list ?? dl ?? []
  const glb = list.find((f) => String(f.name ?? f.url).toLowerCase().endsWith(".glb")) ?? list[0]
  console.log("download list:", JSON.stringify(list.map((f) => f.name)).slice(0, 300))
  if (!glb?.url) {
    console.error("GLB URL yok")
    process.exit(3)
  }
  const out = `./rodin-${uuid}.glb`
  await Bun.write(out, await (await fetch(glb.url)).arrayBuffer())
  console.log(`✔ GLB indirildi: ${out} — aç ve kaliteye bak`)
}

main()
