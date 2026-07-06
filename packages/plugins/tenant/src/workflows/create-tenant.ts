import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { TENANT_MODULE } from "../modules/tenant"
import type TenantModuleService from "../modules/tenant/service"

export type CreateTenantInput = {
  slug: string
  name: string
  // Oluşturan aktör ilk üye (admin) olarak eklenir — sahipsiz tenant kalmasın.
  owner_user_id?: string | null
}

const createTenantStep = createStep(
  "create-tenant-step",
  async (input: CreateTenantInput, { container }) => {
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    const slug = input.slug.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "slug yalnızca küçük harf, rakam ve tire içerebilir"
      )
    }
    const tenant = await service.createTenants({ slug, name: input.name })
    return new StepResponse(tenant, tenant.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    await service.deleteTenants(id)
  }
)

const addOwnerMembershipStep = createStep(
  "add-owner-membership-step",
  async (
    input: { tenant_id: string; user_id?: string | null },
    { container }
  ) => {
    if (!input.user_id) {
      return new StepResponse(null, null)
    }
    const service: TenantModuleService = container.resolve(TENANT_MODULE)
    const membership = await service.createTenantMemberships({
      tenant_id: input.tenant_id,
      user_id: input.user_id,
      role: "admin",
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

const emitTenantCreatedStep = createStep(
  "emit-tenant-created",
  async (
    tenant: { id: string; name: string; slug: string },
    { container }
  ) => {
    try {
      const eventBus = container.resolve(Modules.EVENT_BUS) as {
        emit: (payload: { name: string; data: object }) => Promise<void>
      }
      await eventBus.emit({
        name: "tenant.created",
        data: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      })
    } catch {
      /* event bus optional in tests */
    }
    return new StepResponse(tenant)
  }
)

export const createTenantWorkflow = createWorkflow(
  "create-tenant",
  (input: CreateTenantInput) => {
    const tenant = createTenantStep(input)
    addOwnerMembershipStep({
      tenant_id: tenant.id,
      user_id: input.owner_user_id,
    })
    emitTenantCreatedStep(tenant)
    return new WorkflowResponse(tenant)
  }
)
