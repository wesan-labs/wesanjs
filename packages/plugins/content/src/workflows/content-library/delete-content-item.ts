import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTENT_LIBRARY_MODULE } from "../../modules/content-library"

const deleteContentItemStep = createStep(
  "delete-content-item-step",
  async (id: string, { container }) => {
    const service: any = container.resolve(CONTENT_LIBRARY_MODULE)
    await service.deleteContentItems(id)
    return new StepResponse(id)
  }
)

export const deleteContentItemWorkflow = createWorkflow(
  "delete-content-item",
  function (input: { id: string }) {
    const id = deleteContentItemStep(input.id)
    return new WorkflowResponse(id)
  }
)
