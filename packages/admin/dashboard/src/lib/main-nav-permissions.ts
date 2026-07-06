import type { Permission } from "./permissions"
import type { INavItem } from "../components/layout/nav-item"

/** Permissions that indicate a platform operator (not finance-only). */
export const PLATFORM_OPERATOR_ANCHORS: Permission[] = [
  "user:read",
  "order:read",
  "store:read",
]

/**
 * Route → permissions required to show in the main sidebar (ANY match).
 * When RBAC is enabled:
 * - missing entry → hidden
 * - empty array → visible to platform operators (modules without RBAC matrix yet)
 * - non-empty → ANY matching permission
 */
export const MAIN_NAV_PERMISSIONS: Partial<Record<string, Permission[]>> = {
  "/ecommerce": [
    "order:read",
    "product:read",
    "inventory:read",
    "promotion:read",
    "campaign:read",
    "price_list:read",
  ],
  "/orders": ["order:read"],
  "/products": ["product:read"],
  "/collections": ["product_collection:read"],
  "/categories": ["product_category:read"],
  "/product-options": ["product:read"],
  "/inventory": ["inventory:read"],
  "/reservations": ["reservation:read"],
  "/promotions": ["promotion:read"],
  "/campaigns": ["campaign:read"],
  "/price-lists": ["price_list:read"],
  "/crm": ["customer:read", "customer_group:read"],
  "/customers": ["customer:read"],
  "/customer-groups": ["customer_group:read"],
  "/analytics": [],
  "/revenue": ["revenue:read"],
  "/cms": [],
  "/content": [],
  "/social-media": [],
  "/notifications": [],
  "/adsense": [],
}

export const SETTINGS_NAV_PERMISSIONS: Partial<Record<string, Permission[]>> = {
  "/settings/store": ["store:read"],
  "/settings/expenses": ["revenue:read"],
  "/settings/connections": ["revenue:update", "revenue:read"],
  "/settings/users": ["user:read"],
  "/settings/regions": ["region:read"],
  "/settings/tax-regions": ["tax_region:read"],
  "/settings/return-reasons": ["return_reason:read"],
  "/settings/refund-reasons": ["refund_reason:read"],
  "/settings/sales-channels": ["sales_channel:read"],
  "/settings/product-types": ["product_type:read"],
  "/settings/product-tags": ["product_tag:read"],
  "/settings/locations": ["stock_location:read"],
  "/settings/translations": ["translation:read"],
  "/settings/publishable-api-keys": ["api_key:read"],
  "/settings/secret-api-keys": ["api_key:read"],
  "/settings/workflows": ["workflow:read"],
}

const canSeeRoute = (
  to: string,
  permissionMap: Partial<Record<string, Permission[]>>,
  enforcePermissions: boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean
): boolean => {
  if (!enforcePermissions) {
    return true
  }

  const required = permissionMap[to]
  if (required === undefined) {
    return false
  }

  if (!required.length) {
    return hasAnyPermission(PLATFORM_OPERATOR_ANCHORS)
  }

  return hasAnyPermission(required)
}

const filterNestedItems = (
  items: INavItem["items"],
  permissionMap: Partial<Record<string, Permission[]>>,
  enforcePermissions: boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean
) => {
  if (!items?.length) {
    return items
  }

  return items.filter((item) =>
    canSeeRoute(item.to, permissionMap, enforcePermissions, hasAnyPermission)
  )
}

export const filterMainNavRoutes = (
  routes: Omit<INavItem, "pathname">[],
  enforcePermissions: boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean
): Omit<INavItem, "pathname">[] => {
  if (!enforcePermissions) {
    return routes
  }

  return routes
    .map((route) => {
      const items = filterNestedItems(
        route.items,
        MAIN_NAV_PERMISSIONS,
        enforcePermissions,
        hasAnyPermission
      )

      if (route.isGroup) {
        if (!items?.length) {
          return null
        }
        return { ...route, items }
      }

      return canSeeRoute(
        route.to,
        MAIN_NAV_PERMISSIONS,
        enforcePermissions,
        hasAnyPermission
      )
        ? { ...route, items }
        : null
    })
    .filter((route): route is Omit<INavItem, "pathname"> => route !== null)
}

export const filterSettingsNavRoutes = (
  routes: INavItem[],
  enforcePermissions: boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean
): INavItem[] => {
  if (!enforcePermissions) {
    return routes
  }

  return routes.filter((route) =>
    canSeeRoute(
      route.to,
      SETTINGS_NAV_PERMISSIONS,
      enforcePermissions,
      hasAnyPermission
    )
  )
}

export const hasPlatformOperatorAccess = (
  hasAnyPermission: (permissions: Permission[]) => boolean
): boolean => hasAnyPermission(PLATFORM_OPERATOR_ANCHORS)

export const hasAnyMainNavAccess = (
  enforcePermissions: boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean
): boolean => {
  if (!enforcePermissions) {
    return true
  }

  return Object.entries(MAIN_NAV_PERMISSIONS).some(
    ([to, permissions]) =>
      permissions.length > 0 &&
      canSeeRoute(to, MAIN_NAV_PERMISSIONS, enforcePermissions, hasAnyPermission)
  )
}
