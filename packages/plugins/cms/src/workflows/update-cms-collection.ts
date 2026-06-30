import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../modules/cms/types"
import type CmsModuleService from "../modules/cms/service"

// Koleksiyon güncelleme — şu an sadece schema (içerik-modeli) + label.
// schema = { fields: FieldDef[] } (jsonb). Mutasyon workflow'la (rollback'li).
export type UpdateCmsCollectionInput = {
  id: string
  schema?: Record<string, unknown> | null
  label?: string
}

const updateCmsCollectionStep = createStep(
  "update-cms-collection-step",
  async (input: UpdateCmsCollectionInput, { container }) => {
    const service: CmsModuleService = container.resolve(CMS_MODULE)
    const before = await service.retrieveCmsCollection(input.id)

    const update: Record<string, unknown> = { id: input.id }
    if (input.schema !== undefined) {
      update.schema = input.schema
    }
    if (input.label !== undefined) {
      update.label = input.label
    }

    const collection = await service.updateCmsCollections(update as any)
    return new StepResponse(collection, {
      id: before.id,
      schema: before.schema,
      label: before.label,
    })
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: CmsModuleService = container.resolve(CMS_MODULE)
    await service.updateCmsCollections(prev as any)
  }
)

export const updateCmsCollectionWorkflow = createWorkflow(
  "update-cms-collection",
  (input: UpdateCmsCollectionInput) => {
    const collection = updateCmsCollectionStep(input)
    return new WorkflowResponse(collection)
  }
)
