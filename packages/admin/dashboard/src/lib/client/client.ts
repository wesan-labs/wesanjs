import Medusa from "@medusajs/js-sdk"

export const backendUrl = __BACKEND_URL__ ?? "/"
const authType = __AUTH_TYPE__ ?? "session"
const jwtTokenStorageKey = __JWT_TOKEN_STORAGE_KEY__ || undefined

// Tenant-switcher (A2): seçili tenant tüm admin isteklerine x-tenant-id olarak
// gider (backend tenant-context middleware'i üyeliği doğrular + scope'lar).
// Boot'ta okunur; değişim reload ile uygulanır (hooks/api/tenants.ts).
export const ACTIVE_TENANT_KEY = "levios_active_tenant"
const activeTenantId =
  typeof window !== "undefined"
    ? window.localStorage.getItem(ACTIVE_TENANT_KEY)
    : null

export const sdk = new Medusa({
  baseUrl: backendUrl,
  auth: {
    type: authType,
    jwtTokenStorageKey,
  },
  globalHeaders: activeTenantId ? { "x-tenant-id": activeTenantId } : undefined,
})

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  ;(window as any).__sdk = sdk
}
