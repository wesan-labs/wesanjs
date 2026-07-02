import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { TENANT_MODULE } from "../modules/tenant"
import type TenantModuleService from "../modules/tenant/service"

export type AddMemberInput = {
  tenant_id: string
  user_id: string
  role?: string
}

const addMemberStep = createStep(
  "add-tenant-member-step",
  async (input: AddMemberInput, { container }) => {
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    const existing = await service.listTenantMemberships({
      tenant_id: input.tenant_id,
      user_id: input.user_id,
    })
    if (existing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "kullanıcı zaten bu tenant'ın üyesi"
      )
    }
    const membership = await service.createTenantMemberships({
      tenant_id: input.tenant_id,
      user_id: input.user_id,
      role: input.role ?? "admin",
    })
    return new StepResponse(membership, membership.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    await service.deleteTenantMemberships(id)
  }
)

export const addTenantMemberWorkflow = createWorkflow(
  "add-tenant-member",
  (input: AddMemberInput) => {
    const membership = addMemberStep(input)
    return new WorkflowResponse(membership)
  }
)

const removeMemberStep = createStep(
  "remove-tenant-member-step",
  async (input: { membership_id: string }, { container }) => {
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    const before = await service.retrieveTenantMembership(input.membership_id)
    await service.deleteTenantMemberships(input.membership_id)
    return new StepResponse(
      { id: input.membership_id },
      {
        tenant_id: before.tenant_id,
        user_id: before.user_id,
        role: before.role,
      }
    )
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    await service.createTenantMemberships(prev)
  }
)

export const removeTenantMemberWorkflow = createWorkflow(
  "remove-tenant-member",
  (input: { membership_id: string }) => {
    const removed = removeMemberStep(input)
    return new WorkflowResponse(removed)
  }
)
