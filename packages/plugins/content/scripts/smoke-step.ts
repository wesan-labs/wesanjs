/**
 * Dev smoke — TEK pipeline adımını canlı test et (adaptörü gerçek API'ye karşı doğrula).
 * Doküman-doğrulanmış ② ③ adaptörlerini, key gelince, BFL ①'de yaptığımız disiplinle
 * canlı-doğrulamak için. Gerçek para harcar (tek çağrı).
 *
 * Kullanım (helm/.env yüklensin diye helm dizininden çalıştır):
 *   cd helm && bun run ../wesanjs/packages/plugins/content/scripts/smoke-step.ts \
 *     <hero|orbital|upscale> <sourceUrl> [ref1,ref2,...]
 *
 * Gerekli env: hero=BFL_API_KEY · orbital=ARK_API_KEY · upscale=WAVESPEED_API_KEY
 */
import { envKeyFor, resolveStep, stepInputFor, type AssetInputView } from "../src/lib/three-d/step-registry"

const [step, sourceUrl, refsArg] = process.argv.slice(2)
if (!step || !sourceUrl) {
  console.error("kullanım: smoke-step.ts <hero|orbital|upscale> <sourceUrl> [ref1,ref2]")
  process.exit(1)
}
const refs = (refsArg ?? "").split(",").map((s) => s.trim()).filter(Boolean)

const adapter = resolveStep(step)
if (!adapter) {
  console.error(`${step}: ${envKeyFor(step) ?? "env key"} tanımlı değil`)
  process.exit(1)
}

// Adıma göre AssetInputView kur (stepInputFor'un beklediği kaynak alanı).
const view: AssetInputView =
  step === "hero"
    ? { inputs: [sourceUrl, ...refs] }
    : step === "orbital"
      ? { inputs: refs, hero_url: sourceUrl }
      : { inputs: [], video_url: sourceUrl }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  console.log(`submit → ${step} (source: ${sourceUrl}, refs: ${refs.length})`)
  const job = await adapter.submit(stepInputFor(step, view))
  console.log("job:", JSON.stringify(job))
  if (job.status === "failed") process.exit(1)

  for (let i = 0; i < 90; i++) {
    await sleep(2000)
    const r = await adapter.poll({ jobId: job.jobId, pollUrl: job.pollUrl })
    console.log(`poll ${i}: ${r.status} ${r.outputUrl ?? r.error ?? ""}`)
    if (r.status !== "processing") {
      console.log("SONUÇ:", JSON.stringify(r))
      process.exit(r.status === "ready" ? 0 : 2)
    }
  }
  console.log("TIMEOUT — hâlâ processing")
}

main()
