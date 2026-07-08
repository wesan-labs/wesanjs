import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_3D_MODULE } from "../../modules/product-3d"
import { DEFAULT_PIPELINE, descriptorFor, nextOp } from "../../lib/three-d/pipeline-def"
import { envKeyFor, outputColumnFor, resolveStep, stepInputFor } from "../../lib/three-d/step-registry"

export interface Poll3DAssetInput {
  id: string
}

/**
 * Poll-on-read state-machine — pipeline DESCRIPTOR listesini gezer (§5b, data-driven).
 * Her çağrı TEK iş: aktif adımın job'ı yoksa submit, varsa poll; adım biterse çıktıyı
 * saklar + `nextOp` ile ilerletir (job'ı temizler → sonraki poll submit eder). Key
 * eksikse `processing` kalır. Op-spec/params descriptor'dan gelir; StepInput sade.
 */
const poll3DAssetStep = createStep(
  "poll-3d-asset",
  async (input: Poll3DAssetInput, { container }) => {
    const service: any = container.resolve(PRODUCT_3D_MODULE)
    const asset = await service.retrieveProduct3DAsset(input.id)

    if (asset.status !== "processing") {
      return new StepResponse(asset)
    }
    const pipeline = DEFAULT_PIPELINE
    const op: string = asset.pipeline_step ?? pipeline[0].op
    const desc = descriptorFor(pipeline, op)
    if (!desc) {
      return new StepResponse(asset) // bilinmeyen/terminal op
    }
    const adapter = resolveStep(desc)
    if (!adapter) {
      const note = `${envKeyFor(desc.provider) ?? "API key"} tanımlı değil (${op}) — bekliyor`
      const updated = asset.error === note ? asset : await service.updateProduct3DAssets({ id: asset.id, error: note })
      return new StepResponse(updated)
    }

    // Aktif adımın job'ı yoksa: submit et.
    if (!asset.step_job_id) {
      const job = await adapter.submit(stepInputFor(op, asset))
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
        error: result.error ?? `${op} adımı başarısız`,
      })
      return new StepResponse(updated)
    }

    // ready → çıktıyı sakla + ilerlet.
    const patch: Record<string, unknown> = { id: asset.id, error: null, step_job_id: null, step_poll_url: null }
    const col = outputColumnFor(op)
    if (col) patch[col] = result.outputUrl ?? null

    const next = nextOp(pipeline, op)
    if (!next) {
      // v1: son adım (upscale) → done. ④ kare-örnekleme A4b'de eklenecek.
      patch.pipeline_step = "done"
      patch.status = "ready"
    } else {
      // Sonraki op'a ilerlet; job temiz → sonraki poll submit eder.
      patch.pipeline_step = next.op
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
