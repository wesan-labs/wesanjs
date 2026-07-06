import { Spinner } from "@medusajs/icons"
import { useMemo } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMePermissions } from "../../../hooks/api/rbac-roles"
import { useMe } from "../../../hooks/api/users"
import type { Permission, UserPolicy } from "../../../lib/permissions"
import {
  useFeatureFlag,
  useFeatureFlagContext,
} from "../../../providers/feature-flag-provider"
import { PermissionsProvider } from "../../../providers/permissions-provider"
import { SearchProvider } from "../../../providers/search-provider"
import { SidebarProvider } from "../../../providers/sidebar-provider"

export const ProtectedRoute = () => {
  const location = useLocation()
  const isRbacFlagEnabled = useFeatureFlag("rbac")
  const { isLoading: isLoadingFeatureFlags } = useFeatureFlagContext()

  const { user, isLoading: isLoadingUser } = useMe()
  const {
    data: permissionsResponse,
    isLoading: isLoadingPermissions,
    isFetched: permissionsFetched,
    isError: permissionsFetchFailed,
  } = useMePermissions({
    enabled: !!user && !isLoadingFeatureFlags,
    retry: false,
  })

  // Backend may enforce RBAC even when the feature-flag endpoint is stale/missing.
  const rbacEnforced =
    isRbacFlagEnabled ||
    (permissionsFetched && !permissionsFetchFailed && !!permissionsResponse)

  const policy: UserPolicy | null = useMemo(() => {
    if (!permissionsResponse) {
      return null
    }
    return {
      permissions: permissionsResponse.permissions as Permission[],
    }
  }, [permissionsResponse])

  const awaitingPermissions =
    !!user && !isLoadingFeatureFlags && !permissionsFetched

  if (isLoadingUser || isLoadingFeatureFlags || awaitingPermissions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <PermissionsProvider
      policy={policy}
      isLoading={isLoadingPermissions}
      isRbacEnabled={rbacEnforced}
    >
      <SidebarProvider>
        <SearchProvider>
          <Outlet />
        </SearchProvider>
      </SidebarProvider>
    </PermissionsProvider>
  )
}
