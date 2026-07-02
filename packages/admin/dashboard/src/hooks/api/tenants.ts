import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { ACTIVE_TENANT_KEY } from "../../lib/client/client"

export type Tenant = {
  id: string
  slug: string
  name: string
  status: string
  member_count?: number
  role?: string | null
  created_at: string
}

export type TenantMember = {
  id: string
  tenant_id: string
  user_id: string
  role: string
  email: string | null
  created_at: string
}

// Aktif tenant (switcher): localStorage'da durur; sdk globalHeaders bunu
// boot'ta okur (lib/client/client.ts — tek kaynak). Değişim reload ister.
export { ACTIVE_TENANT_KEY }

export const getActiveTenantId = (): string | null =>
  typeof window !== "undefined"
    ? window.localStorage.getItem(ACTIVE_TENANT_KEY)
    : null

export const setActiveTenantId = (id: string | null) => {
  if (typeof window === "undefined") {
    return
  }
  if (id) {
    window.localStorage.setItem(ACTIVE_TENANT_KEY, id)
  } else {
    window.localStorage.removeItem(ACTIVE_TENANT_KEY)
  }
  window.location.reload()
}

export const tenantQueryKeys = {
  list: ["tenants"] as const,
  detail: (id: string) => ["tenants", id] as const,
  me: ["tenants", "me"] as const,
}

export const useTenants = () => {
  const { data, ...rest } = useQuery({
    queryKey: tenantQueryKeys.list,
    queryFn: () =>
      sdk.client.fetch<{ tenants: Tenant[]; count: number }>("/admin/tenants"),
  })
  return { tenants: data?.tenants ?? [], count: data?.count ?? 0, ...rest }
}

export const useMyTenants = () => {
  const { data, ...rest } = useQuery({
    queryKey: tenantQueryKeys.me,
    queryFn: () => sdk.client.fetch<{ tenants: Tenant[] }>("/admin/tenants/me"),
  })
  return { tenants: data?.tenants ?? [], ...rest }
}

export const useTenantDetail = (id: string | null) => {
  const { data, ...rest } = useQuery({
    queryKey: tenantQueryKeys.detail(id ?? ""),
    queryFn: () =>
      sdk.client.fetch<{ tenant: Tenant; members: TenantMember[] }>(
        `/admin/tenants/${id}`
      ),
    enabled: !!id,
  })
  return { tenant: data?.tenant, members: data?.members ?? [], ...rest }
}

export const useCreateTenant = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { slug: string; name: string }) =>
      sdk.client.fetch("/admin/tenants", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQueryKeys.list })
      qc.invalidateQueries({ queryKey: tenantQueryKeys.me })
    },
  })
}

export const useUpdateTenant = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name?: string; status?: string }) =>
      sdk.client.fetch(`/admin/tenants/${id}`, { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQueryKeys.list })
      qc.invalidateQueries({ queryKey: tenantQueryKeys.detail(id) })
    },
  })
}

export const useAddTenantMember = (tenantId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; role?: string }) =>
      sdk.client.fetch(`/admin/tenants/${tenantId}/members`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantId) })
      qc.invalidateQueries({ queryKey: tenantQueryKeys.list })
    },
  })
}

export const useRemoveTenantMember = (tenantId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (membershipId: string) =>
      sdk.client.fetch(`/admin/tenants/${tenantId}/members/${membershipId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantId) })
      qc.invalidateQueries({ queryKey: tenantQueryKeys.list })
    },
  })
}
