import {
  BellAlert,
  BuildingStorefront,
  ChartBar,
  ChatBubbleLeftRight,
  CogSixTooth,
  CurrencyDollar,
  CursorArrowRays,
  EllipsisHorizontal,
  MagnifyingGlass,
  Newspaper,
  OpenRectArrowOut,
  ShoppingBag,
  SquaresPlus,
  UserGroup,
} from "@medusajs/icons"
import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { Avatar, clx, Divider, DropdownMenu, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"

import { useStore } from "../../../hooks/api/store"
import {
  filterSwitcherTenants,
  setActiveTenantId,
  useActiveTenant,
} from "../../../hooks/api/tenants"
import {
  filterMainNavRoutes,
} from "../../../lib/main-nav-permissions"
import { LayoutComposer } from "../../layout-composer"
import { PermissionGuard } from "../../common/permission-guard"
import { Skeleton } from "../../common/skeleton"
import { INavItem, NavItem } from "../../layout/nav-item"
import { Shell } from "../../layout/shell"

import { Link, useLocation, useNavigate } from "react-router-dom"
import { useLogout } from "../../../hooks/api"
import { queryClient } from "../../../lib/query-client"
import { useExtension } from "../../../providers/extension-provider"
import { usePermissions } from "../../../providers/permissions-provider"
import { useSearch } from "../../../providers/search-provider"
import { UserMenu } from "../user-menu"
import { useDocumentDirection } from "../../../hooks/use-document-direction"
import { CUSTOMIZE_IDS } from "../../layout-composer/constants"

export const MainLayout = () => {
  return (
    <Shell>
      <MainSidebar />
    </Shell>
  )
}

const MainSidebar = () => {
  return (
    <aside
      className="bg-ui-bg-subtle flex flex-1 flex-col justify-between overflow-y-auto"
      data-glass-chrome
    >
      <div className="flex flex-1 flex-col">
        <div className="bg-ui-bg-subtle sticky top-0">
          <WorkspaceHeader />
          <div className="px-3">
            <Divider variant="dashed" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-1 flex-col">
            <SidebarRoutes />
          </div>
          <UtilitySection />
        </div>
        <div className="bg-ui-bg-subtle sticky bottom-0">
          <UserSection />
        </div>
      </div>
    </aside>
  )
}

const Logout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { mutateAsync: logoutMutation } = useLogout()

  const handleLogout = async () => {
    await logoutMutation(undefined, {
      onSuccess: () => {
        /**
         * When the user logs out, we want to clear the query cache
         */
        queryClient.clear()
        navigate("/login")
      },
    })
  }

  return (
    <DropdownMenu.Item onClick={handleLogout}>
      <div className="flex items-center gap-x-2">
        <OpenRectArrowOut className="text-ui-fg-subtle" />
        <span>{t("app.menus.actions.logout")}</span>
      </div>
    </DropdownMenu.Item>
  )
}

const WorkspaceHeader = () => {
  const { t } = useTranslation()
  const { store, isPending: storePending } = useStore()
  const { activeTenant, tenants, isLoading: tenantsLoading, storedTenantId } =
    useActiveTenant()
  const switcherTenants = useMemo(
    () => filterSwitcherTenants(tenants),
    [tenants]
  )
  const direction = useDocumentDirection()
  const storedId = storedTenantId

  const displayName = activeTenant?.name ?? store?.name
  const fallback = displayName?.slice(0, 1).toUpperCase()
  const isLoaded =
    !storePending && !tenantsLoading && !!displayName && !!fallback

  return (
    <div className="w-full p-3">
      <DropdownMenu dir={direction}>
        <DropdownMenu.Trigger
          disabled={!isLoaded}
          className={clx(
            "bg-ui-bg-subtle transition-fg grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md p-0.5 pe-2 outline-none",
            "hover:bg-ui-bg-subtle-hover",
            "data-[state=open]:bg-ui-bg-subtle-hover",
            "focus-visible:shadow-borders-focus"
          )}
        >
          {fallback ? (
            <Avatar variant="squared" size="xsmall" fallback={fallback} />
          ) : (
            <Skeleton className="h-6 w-6 rounded-md" />
          )}
          <div className="block overflow-hidden text-start">
            {displayName ? (
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="truncate"
              >
                {displayName}
              </Text>
            ) : (
              <Skeleton className="h-[9px] w-[120px]" />
            )}
          </div>
          <EllipsisHorizontal className="text-ui-fg-muted" />
        </DropdownMenu.Trigger>
        {isLoaded && (
          <DropdownMenu.Content className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0">
            <div className="flex items-center gap-x-3 px-2 py-1">
              <Avatar variant="squared" size="small" fallback={fallback} />
              <div className="flex flex-col overflow-hidden">
                <Text
                  size="small"
                  weight="plus"
                  leading="compact"
                  className="truncate"
                >
                  {displayName}
                </Text>
                <Text
                  size="xsmall"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {activeTenant
                    ? t("organization.domain")
                    : t("app.nav.main.store")}
                </Text>
              </div>
            </div>
            {switcherTenants.length > 0 ? (
              <>
                <DropdownMenu.Separator />
                {switcherTenants.map((org) => (
                  <DropdownMenu.Item
                    key={org.id}
                    className="gap-x-2"
                    onClick={() => {
                      if (org.id !== storedId) {
                        setActiveTenantId(org.id)
                      }
                    }}
                  >
                    <UserGroup className="text-ui-fg-subtle" />
                    <span className="truncate">{org.name}</span>
                    {org.id === (storedId ?? activeTenant?.id) ? (
                      <span className="text-ui-fg-muted ms-auto text-xs">
                        ✓
                      </span>
                    ) : null}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Item className="gap-x-2" asChild>
                  <Link to="/settings/organization">
                    <CogSixTooth className="text-ui-fg-subtle" />
                    {t("organization.domain")}
                  </Link>
                </DropdownMenu.Item>
              </>
            ) : null}
            <PermissionGuard resource="store" operation="read">
              <DropdownMenu.Separator />
              <DropdownMenu.Item className="gap-x-2" asChild>
                <Link to="/settings/store">
                  <BuildingStorefront className="text-ui-fg-subtle" />
                  {t("app.nav.main.storeSettings")}
                </Link>
              </DropdownMenu.Item>
            </PermissionGuard>
            <DropdownMenu.Separator />
            <Logout />
          </DropdownMenu.Content>
        )}
      </DropdownMenu>
    </div>
  )
}

const useCoreRoutes = (): Omit<INavItem, "pathname">[] => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        icon: <ShoppingBag />,
        label: "E-Commerce",
        to: "/ecommerce",
        isGroup: true,
        items: [
          { label: "Dashboard", to: "/ecommerce" },
          { label: t("orders.domain"), to: "/orders" },
          { label: t("products.domain"), to: "/products" },
          { label: t("collections.domain"), to: "/collections" },
          { label: t("categories.domain"), to: "/categories" },
          { label: t("productOptions.domain"), to: "/product-options" },
          { label: t("inventory.domain"), to: "/inventory" },
          { label: t("reservations.domain"), to: "/reservations" },
          { label: t("promotions.domain"), to: "/promotions" },
          { label: t("campaigns.domain"), to: "/campaigns" },
          { label: t("priceLists.domain"), to: "/price-lists" },
        ],
      },
      {
        icon: <UserGroup />,
        label: "CRM",
        to: "/crm",
        isGroup: true,
        items: [
          { label: "Dashboard", to: "/crm" },
          { label: t("customers.domain"), to: "/customers" },
          { label: t("customerGroups.domain"), to: "/customer-groups" },
        ],
      },
      {
        icon: <ChartBar />,
        label: "Analytics",
        to: "/analytics",
      },
      {
        icon: <CurrencyDollar />,
        label: "Revenue",
        to: "/revenue",
      },
      {
        icon: <Newspaper />,
        label: "CMS",
        to: "/cms",
      },
      {
        icon: <ChatBubbleLeftRight />,
        label: "Social Media",
        to: "/social-media",
        isGroup: true,
        items: [
          { label: "Content", to: "/content" },
          { label: "Analiz", to: "/social-media" },
        ],
      },
      {
        icon: <BellAlert />,
        label: "Notifications",
        to: "/notifications",
      },
      {
        icon: <CursorArrowRays />,
        label: "AdSense",
        to: "/adsense",
      },
    ],
    [t]
  )
}

const Searchbar = () => {
  const { t } = useTranslation()
  const { toggleSearch } = useSearch()

  return (
    <div>
      <button
        onClick={toggleSearch}
        className={clx(
          "bg-ui-bg-subtle text-ui-fg-subtle flex w-full items-center gap-x-2.5 rounded-md px-2 py-1 outline-none",
          "hover:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus"
        )}
      >
        <MagnifyingGlass />
        <div className="flex-1 text-start">
          <Text size="small" leading="compact" weight="plus">
            {t("app.search.label")}
          </Text>
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-muted">
          ⌘K
        </Text>
      </button>
    </div>
  )
}

/**
 * The customizable nav. Every top-level route(core and extensions) is
 * fed to the `LayoutComposer` as its own entry, so each can be reordered/hidden
 * (and its children reordered) independently in edit mode.
 */
const SidebarRoutes = () => {
  const { hasAnyPermission, isLoading: permissionsLoading, policy } =
    usePermissions()
  const allCoreRoutes = useCoreRoutes()
  const enforceNav = policy !== null
  const coreRoutes = useMemo(
    () => filterMainNavRoutes(allCoreRoutes, enforceNav, hasAnyPermission),
    [allCoreRoutes, enforceNav, hasAnyPermission]
  )
  const showSearch =
    !enforceNav ||
    hasAnyPermission([
      "order:read",
      "product:read",
      "customer:read",
      "inventory:read",
    ])

  if (enforceNav && permissionsLoading) {
    return (
      <nav className="py-3">
        <div className="px-3">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </nav>
    )
  }

  const { getMenu } = useExtension()

  const menuItems = getMenu("coreExtensions")

  menuItems.forEach((item) => {
    if (item.nested) {
      const route = coreRoutes.find((route) => route.to === item.nested)
      if (route) {
        route.items?.push(item)
      }
    }
  })

  const extensionItems = menuItems.filter((item) => !item.nested)

  const visibleExtensionItems = enforceNav
    ? extensionItems.filter((item) =>
        filterMainNavRoutes(
          [
            {
              label: item.label,
              to: item.to,
              items: item.items,
            },
          ],
          enforceNav,
          hasAnyPermission
        ).length > 0
      )
    : extensionItems

  return (
    <nav className="py-3">
      <div className="px-3">
        <LayoutComposer
          widgetsZonePrefix="sidebar"
          preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
          hasOutlet={false}
          disableWidgets
          customizeId={CUSTOMIZE_IDS.MAIN_SIDEBAR}
          controlSize="small"
          layoutProps={{
            className: "gap-y-1",
          }}
          sections={{
            main: (
              <>
                {showSearch ? (
                  <LayoutComposer.Entry id="Searchbar">
                    <Searchbar />
                  </LayoutComposer.Entry>
                ) : null}
                {coreRoutes.map((route) => (
                  <LayoutComposer.Entry id={`nav:${route.to}`} key={route.to}>
                    <NavItem key={route.to} {...route} />
                  </LayoutComposer.Entry>
                ))}
                {visibleExtensionItems.map((item) => (
                  <LayoutComposer.Entry id={`nav:${item.to}`} key={item.to}>
                    <NavItem
                      key={item.to}
                      to={item.to}
                      label={item.label}
                      icon={item.icon ? item.icon : <SquaresPlus />}
                      items={item.items}
                      translationNs={item.translationNs}
                      type="extension"
                    />
                  </LayoutComposer.Entry>
                ))}
              </>
            ),
          }}
        />
      </div>
    </nav>
  )
}

const UtilitySection = () => {
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-0.5 px-3 py-3">
      <NavItem
        label={t("app.nav.settings.header")}
        to="/settings"
        from={location.pathname}
        icon={<CogSixTooth />}
      />
    </div>
  )
}

const UserSection = () => {
  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <UserMenu />
    </div>
  )
}
