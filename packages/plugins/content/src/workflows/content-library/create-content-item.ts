import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTENT_LIBRARY_MODULE } from "../../modules/content-library"

export interface CreateContentItemInput {
  kind: "image" | "text"
  value: string
  title?: string | null
  language?: string | null
  platform?: string | null
  prompt_id?: string | null
  tenant_id?: string | null
}

const createContentItemStep = createStep(
  "create-content-item-step",
  async (input: CreateContentItemInput, { container }) => {
    const service: any = container.resolve(CONTENT_LIBRARY_MODULE)
    const item = await service.createContentItems(input)
    return new StepResponse(item, item.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: any = container.resolve(CONTENT_LIBRARY_MODULE)
    await service.deleteContentItems(id)
  }
)

export const createContentItemWorkflow = createWorkflow(
  "create-content-item",
  function (input: CreateContentItemInput) {
    const item = createContentItemStep(input)
    return new WorkflowResponse(item)
  }
)
