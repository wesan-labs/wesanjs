import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_3D_MODULE } from "../../modules/product-3d"
import { nextStep, type PipelineStep } from "../../lib/three-d/pipeline"
import { envKeyFor, outputColumnFor, resolveStep, stepInputFor } from "../../lib/three-d/step-registry"

export interface Poll3DAssetInput {
  id: string
}

/**
 * Poll-on-read state-machine (Flux2→Seedance→SeeDVR). Her çağrı TEK iş yapar:
 * aktif adımın job'ı yoksa submit eder, varsa poll eder; adım biterse çıktıyı
 * saklar + bir sonraki adıma ilerletir (job'ı temizler → sonraki poll submit eder).
 * Key eksikse `processing` kalır, bilgilendirici error yazar → key gelince devam.
 * v1: `sample` (④ kare-örnekleme, ffmpeg) ertelendi — `upscale` sonrası `done`.
 * Job altyapısı yok — GET /:id tetikler. Mutasyon → workflow (route değil).
 */
const poll3DAssetStep = createStep(
  "poll-3d-asset",
  async (input: Poll3DAssetInput, { container }) => {
    const service: any = container.resolve(PRODUCT_3D_MODULE)
    const asset = await service.retrieveProduct3DAsset(input.id)

    if (asset.status !== "processing") {
      return new StepResponse(asset)
    }
    const step: string = asset.pipeline_step ?? "hero"
    const adapter = resolveStep(step)
    if (!adapter) {
      // Bu adımın key'i eksik → bekle, bilgilendir (idempotent).
      const note = `${envKeyFor(step) ?? "API key"} tanımlı değil (${step}) — bekliyor`
      const updated = asset.error === note ? asset : await service.updateProduct3DAssets({ id: asset.id, error: note })
      return new StepResponse(updated)
    }

    // Aktif adımın job'ı yoksa: submit et.
    if (!asset.step_job_id) {
      const job = await adapter.submit(stepInputFor(step, asset))
      const updated = await service.updateProduct3DAssets({
        id: asset.id,
        step_job_id: job.jobId || null,
        step_poll_url: job.pollUrl ?? null,
        status: job.status === "failed" ? "failed" : "processing",
        error: job.error ?? null,
      })
      return new StepResponse(updated)
    }

    // Job var: poll et.
    const result = await adapter.poll({ jobId: asset.step_job_id, pollUrl: asset.step_poll_url ?? undefined })
    if (result.status === "processing") {
      return new StepResponse(asset)
    }
    if (result.status === "failed") {
      const updated = await service.updateProduct3DAssets({
        id: asset.id,
        status: "failed",
        error: result.error ?? `${step} adımı başarısız`,
      })
      return new StepResponse(updated)
    }

    // ready → çıktıyı sakla + ilerlet.
    const patch: Record<string, unknown> = { id: asset.id, error: null }
    const col = outputColumnFor(step)
    if (col) patch[col] = result.outputUrl ?? null

    const next = nextStep(step as PipelineStep)
    if (next === "sample" || next === "done") {
      // v1: kare-örnekleme ertelendi → video_url final, tamam.
      patch.pipeline_step = "done"
      patch.status = "ready"
      patch.step_job_id = null
      patch.step_poll_url = null
    } else {
      // Sonraki adıma ilerlet; job'ı temizle → sonraki poll submit eder.
      patch.pipeline_step = next
      patch.step_job_id = null
      patch.step_poll_url = null
    }
    const updated = await service.updateProduct3DAssets(patch)
    return new StepResponse(updated)
  }
)

export const pollProduct3DAssetWorkflow = createWorkflow(
  "poll-product-3d-asset",
  function (input: Poll3DAssetInput) {
    const asset = poll3DAssetStep(input)
    return new WorkflowResponse(asset)
  }
)
