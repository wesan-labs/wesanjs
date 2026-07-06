import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useSyncExternalStore } from "react"
import { sdk } from "../../lib/client"
import {
  ACTIVE_TENANT_KEY,
  readStoredTenantId,
  syncActiveTenantHeader,
} from "../../lib/client/client"
import { queryClient } from "../../lib/query-client"
import { mePermissionsQueryKey } from "./rbac-roles"

export type Tenant = {
  id: string
  slug: string
  name: string
  status: string
  member_count?: number
  role?: string | null
  rbac_role_id?: string | null
  created_at: string
}

export type TenantMember = {
  id: string
  tenant_id: string
  user_id: string
  role: string
  rbac_role_id?: string | null
  email: string | null
  created_at: string
}

// Aktif tenant (switcher): localStorage + SDK header (lib/client/client.ts).
export { ACTIVE_TENANT_KEY }

const activeTenantListeners = new Set<() => void>()

const notifyActiveTenantListeners = () => {
  activeTenantListeners.forEach((listener) => listener())
}

export const subscribeActiveTenantId = (listener: () => void) => {
  activeTenantListeners.add(listener)
  return () => activeTenantListeners.delete(listener)
}

export const getActiveTenantId = (): string | null => readStoredTenantId()

export const useActiveTenantId = () =>
  useSyncExternalStore(subscribeActiveTenantId, getActiveTenantId, () => null)

/** Prefix React Query keys with the active org so tenant switches never show stale cache. */
export const useTenantQueryKey = (base: readonly unknown[]) => {
  const tenantId = useActiveTenantId()
  return [...base, tenantId] as const
}

export const setActiveTenantId = (id: string | null) => {
  if (typeof window === "undefined") {
    return
  }
  syncActiveTenantHeader(id)
  notifyActiveTenantListeners()
  // Tenant-scoped data must refetch under the new x-tenant-id header.
  queryClient.invalidateQueries()
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

/** Primary working org — revenue, CMS, and social should live here. */
export const PRIMARY_TENANT_SLUG = "wesan-tenant"
/** Pre–multi-tenant revenue rows (migrated to PRIMARY by consolidate-wesan-org). */
export const LEGACY_REVENUE_TENANT_SLUG = "default"
/** @deprecated Use PRIMARY_TENANT_SLUG — CMS shares the same org after consolidation. */
export const CMS_HOME_TENANT_SLUG = PRIMARY_TENANT_SLUG

/** Pilot/demo orgs — hidden from the switcher unless user is finance-only on them. */
export const PILOT_TENANT_SLUGS = new Set([
  "acme",
  "beta",
  "beta-tenant",
  "default",
])

export const isPilotTenant = (tenant: Pick<Tenant, "slug">) =>
  PILOT_TENANT_SLUGS.has(tenant.slug)

/** Orgs shown in the header switcher (primary + non-pilot; fallback = all memberships). */
export const filterSwitcherTenants = (tenants: Tenant[]): Tenant[] => {
  const primary = tenants.filter((t) => t.slug === PRIMARY_TENANT_SLUG)
  const nonPilot = tenants.filter(
    (t) => t.slug !== PRIMARY_TENANT_SLUG && !isPilotTenant(t)
  )
  const visible = [...primary, ...nonPilot]
  return visible.length ? visible : tenants
}

/** Pick active org: saved → Wesan (primary) → legacy Default → finance role org → first. */
export const resolveDefaultTenantId = (tenants: Tenant[]): string | null => {
  if (!tenants.length) {
    return null
  }

  const stored = readStoredTenantId()
  if (stored && tenants.some((t) => t.id === stored)) {
    return stored
  }

  const primary = tenants.find((t) => t.slug === PRIMARY_TENANT_SLUG)
  if (primary) {
    return primary.id
  }

  const legacy = tenants.find((t) => t.slug === LEGACY_REVENUE_TENANT_SLUG)
  if (legacy) {
    return legacy.id
  }

  const withModuleRole = tenants.find((t) => t.rbac_role_id)
  if (withModuleRole) {
    return withModuleRole.id
  }

  return tenants[0]?.id ?? null
}

/** Resolved active org: stored pick → Default (legacy revenue) → finance org → first. */
export const useActiveTenant = () => {
  const storedId = useActiveTenantId()
  const { tenants, isLoading, ...rest } = useTenants()

  const preferredId = resolveDefaultTenantId(tenants)
  const preferredTenant =
    tenants.find((t) => t.id === preferredId) ?? tenants[0] ?? null

  useEffect(() => {
    if (isLoading || !tenants.length) {
      return
    }

    const nextId = resolveDefaultTenantId(tenants)
    if (!nextId) {
      return
    }

    const stored = readStoredTenantId()
    if (stored === nextId) {
      return
    }

    // Only auto-set header when nothing valid is stored (don't override explicit picks).
    if (stored && tenants.some((t) => t.id === stored)) {
      return
    }

    setActiveTenantId(nextId)
  }, [tenants, isLoading])

  return {
    activeTenant: preferredTenant,
    activeTenantId: preferredTenant?.id ?? null,
    storedTenantId: storedId,
    tenants,
    isLoading,
    ...rest,
  }
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
    mutationFn: (input: {
      email: string
      role?: string
      rbac_role_id?: string | null
    }) =>
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

export const useUpdateTenantMember = (tenantId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      membershipId: string
      role?: string
      rbac_role_id?: string | null
    }) =>
      sdk.client.fetch(
        `/admin/tenants/${tenantId}/members/${input.membershipId}`,
        {
          method: "PATCH",
          body: {
            role: input.role,
            rbac_role_id: input.rbac_role_id,
          },
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantId) })
      qc.invalidateQueries({ queryKey: mePermissionsQueryKey })
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
