import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_3D_MODULE } from "../../modules/product-3d"
import { DEFAULT_PIPELINE } from "../../lib/three-d/pipeline-def"
import { resolveStep, stepInputFor } from "../../lib/three-d/step-registry"

export interface Create3DAssetInput {
  images: string[]
  source?: "physical" | "digital-mockup"
  tenant_id?: string | null
  brand_id?: string | null
  product_ref?: string | null
}

/**
 * Pipeline'ı başlat: ① hero (Flux2) adımını submit et, `processing` varlık olarak
 * sakla. Sonraki adımlar (orbital→upscale) poll-on-read ile ilerler. Rollback: sil.
 */
const create3DAssetStep = createStep(
  "create-3d-asset",
  async (input: Create3DAssetInput, { container }) => {
    const service: any = container.resolve(PRODUCT_3D_MODULE)
    const heroDesc = DEFAULT_PIPELINE[0]
    const hero = resolveStep(heroDesc)
    if (!hero) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "BFL_API_KEY tanımlı değil")
    }
    const job = await hero.submit(stepInputFor(heroDesc.op, { inputs: input.images }))
    const asset = await service.createProduct3DAssets({
      tenant_id: input.tenant_id ?? null,
      brand_id: input.brand_id ?? null,
      source: input.source ?? "physical",
      product_ref: input.product_ref ?? null,
      inputs: input.images,
      pipeline_step: heroDesc.op,
      step_job_id: job.jobId || null,
      step_poll_url: job.pollUrl ?? null,
      hero_url: null,
      video_url: null,
      turntable_urls: null,
      mesh_url: null,
      thumbnail_url: null,
      provider: "bfl-flux2-pipeline",
      provider_task_id: null,
      status: job.status,
      error: job.error ?? null,
    })
    return new StepResponse(asset, asset.id)
  },
  async (assetId, { container }) => {
    if (!assetId) return
    const service: any = container.resolve(PRODUCT_3D_MODULE)
    await service.deleteProduct3DAssets(assetId)
  }
)

export const createProduct3DAssetWorkflow = createWorkflow(
  "create-product-3d-asset",
  function (input: Create3DAssetInput) {
    const asset = create3DAssetStep(input)
    return new WorkflowResponse(asset)
  }
)
