import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms/types"
import type CmsModuleService from "../modules/cms/service"

// base_url yalnızca http(s) — javascript:/data: gibi şemalar önizleme iframe'inde
// XSS olur. Sunucuda da reddet (defense-in-depth, frontend doğrulamasına ek).
const assertHttpUrl = (raw?: string | null) => {
  if (!raw) {
    return
  }
  let ok = false
  try {
    const u = new URL(raw)
    ok = u.protocol === "http:" || u.protocol === "https:"
  } catch {
    ok = false
  }
  if (!ok) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "base_url yalnızca http:// veya https:// olabilir"
    )
  }
}

export type CreateCmsSiteInput = {
  slug: string
  name: string
  base_url?: string | null
  preview_secret?: string | null
  locales?: string[] | null
  // A1: tenant context'ten damgalanır (route koyar); null = platform kaydı.
  tenant_id?: string | null
}

const createCmsSiteStep = createStep(
  "create-cms-site-step",
  async (input: CreateCmsSiteInput, { container }) => {
    assertHttpUrl(input.base_url)
    const service: CmsModuleService = container.resolve(CMS_MODULE)
    const site = await service.createCmsSites({
      slug: input.slug,
      name: input.name,
      tenant_id: input.tenant_id ?? null,
      base_url: input.base_url ?? null,
      preview_secret: input.preview_secret ?? null,
      // json alanı: Medusa string[]'i Record olarak tipler; runtime'da dizi saklanır.
      locales: (input.locales ?? null) as Record<string, unknown> | null,
    })
    return new StepResponse(site, site.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: CmsModuleService = container.resolve(CMS_MODULE)
    await service.deleteCmsSites(id)
  }
)

export const createCmsSiteWorkflow = createWorkflow(
  "create-cms-site",
  (input: CreateCmsSiteInput) => {
    const site = createCmsSiteStep(input)
    return new WorkflowResponse(site)
  }
)
