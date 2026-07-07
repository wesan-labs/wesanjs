import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_3D_MODULE } from "../../modules/product-3d"
import { createTripoProvider } from "../../lib/three-d/providers/tripo"

export interface Poll3DAssetInput {
  id: string
}

/**
 * Poll-on-read: varlık `processing` ise sağlayıcıyı sorgula; biterse
 * status/mesh_url güncelle. Job altyapısı yok — GET /:id bunu tetikler.
 * Mutasyon olduğu için route değil workflow (arch-workflow-required).
 */
const poll3DAssetStep = createStep(
  "poll-3d-asset",
  async (input: Poll3DAssetInput, { container }) => {
    const service: any = container.resolve(PRODUCT_3D_MODULE)
    const asset = await service.retrieveProduct3DAsset(input.id)

    if (asset.status !== "processing" || !asset.provider_task_id) {
      return new StepResponse(asset)
    }
    const apiKey = process.env.TRIPO_API_KEY
    if (!apiKey) {
      return new StepResponse(asset)
    }

    const provider = createTripoProvider(apiKey)
    const gen = await provider.poll(asset.provider_task_id)
    if (gen.status === "processing") {
      return new StepResponse(asset)
    }

    const updated = await service.updateProduct3DAssets({
      id: asset.id,
      status: gen.status,
      mesh_url: gen.meshUrl ?? null,
      error: gen.error ?? null,
    })
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
