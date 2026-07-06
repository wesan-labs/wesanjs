import Medusa from "@medusajs/js-sdk"

export const backendUrl = __BACKEND_URL__ ?? "/"
const authType = __AUTH_TYPE__ ?? "session"
const jwtTokenStorageKey = __JWT_TOKEN_STORAGE_KEY__ || undefined

// Tenant scope: mutable object ref — SDK reads globalHeaders on every fetch.
export const ACTIVE_TENANT_KEY = "levios_active_tenant"
export const tenantHeaders: Record<string, string> = {}

const readStoredTenantId = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }
  return window.localStorage.getItem(ACTIVE_TENANT_KEY)
}

export { readStoredTenantId }

const bootTenantId = readStoredTenantId()
if (bootTenantId) {
  tenantHeaders["x-tenant-id"] = bootTenantId
}

export const syncActiveTenantHeader = (id: string | null) => {
  if (typeof window === "undefined") {
    return
  }
  if (id) {
    window.localStorage.setItem(ACTIVE_TENANT_KEY, id)
    tenantHeaders["x-tenant-id"] = id
  } else {
    window.localStorage.removeItem(ACTIVE_TENANT_KEY)
    delete tenantHeaders["x-tenant-id"]
  }
}

export const sdk = new Medusa({
  baseUrl: backendUrl,
  auth: {
    type: authType,
    jwtTokenStorageKey,
  },
  globalHeaders: tenantHeaders,
})

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  ;(window as any).__sdk = sdk
}
