import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_3D_MODULE } from "../../modules/product-3d"
import { createTripoProvider } from "../../lib/three-d/providers/tripo"

export interface Create3DAssetInput {
  images: string[]
  source?: "physical" | "digital-mockup"
  tenant_id?: string | null
  brand_id?: string | null
}

/** Sağlayıcıya görev aç + `processing` varlık olarak sakla. Rollback: varlığı sil. */
const create3DAssetStep = createStep(
  "create-3d-asset",
  async (input: Create3DAssetInput, { container }) => {
    const service: any = container.resolve(PRODUCT_3D_MODULE)
    const apiKey = process.env.TRIPO_API_KEY
    if (!apiKey) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "TRIPO_API_KEY tanımlı değil")
    }
    const provider = createTripoProvider(apiKey)
    const gen = await provider.create({ images: input.images })
    const asset = await service.createProduct3DAssets({
      tenant_id: input.tenant_id ?? null,
      brand_id: input.brand_id ?? null,
      source: input.source ?? "physical",
      inputs: input.images,
      provider: provider.name,
      provider_task_id: gen.providerTaskId || null,
      status: gen.status,
      error: gen.error ?? null,
      mesh_url: gen.meshUrl ?? null,
      thumbnail_url: null,
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
