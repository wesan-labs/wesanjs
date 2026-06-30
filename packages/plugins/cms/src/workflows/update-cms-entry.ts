import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../modules/cms/types"
import type CmsModuleService from "../modules/cms/service"

export type UpdateCmsEntryInput = {
  id: string
  data?: Record<string, unknown>
  status?: "draft" | "published"
}

const updateCmsEntryStep = createStep(
  "update-cms-entry-step",
  async (input: UpdateCmsEntryInput, { container }) => {
    const service: CmsModuleService = container.resolve(CMS_MODULE)
    const before = await service.retrieveCmsEntry(input.id)

    const update: Record<string, unknown> = { id: input.id }
    if (input.data !== undefined) {
      update.data = input.data
    }
    if (input.status !== undefined) {
      update.status = input.status
      update.published_at = input.status === "published" ? new Date() : null
    }

    const entry = await service.updateCmsEntries(update as any)
    return new StepResponse(entry, {
      id: before.id,
      data: before.data,
      status: before.status,
      published_at: before.published_at,
    })
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: CmsModuleService = container.resolve(CMS_MODULE)
    await service.updateCmsEntries(prev as any)
  }
)

export const updateCmsEntryWorkflow = createWorkflow(
  "update-cms-entry",
  (input: UpdateCmsEntryInput) => {
    const entry = updateCmsEntryStep(input)
    return new WorkflowResponse(entry)
  }
)
