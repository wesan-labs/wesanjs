import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { Permission } from "../../lib/permissions"
import { usePermissions } from "../../providers/permissions-provider"

const LANDING_ROUTES: { permission: Permission; path: string }[] = [
  { permission: "order:read", path: "/orders" },
  { permission: "revenue:read", path: "/revenue" },
  { permission: "product:read", path: "/products" },
  { permission: "customer:read", path: "/customers" },
]

export const Home = () => {
  const navigate = useNavigate()
  const { hasPermission, isLoading, policy } = usePermissions()

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!policy) {
      navigate("/orders", { replace: true })
      return
    }

    for (const route of LANDING_ROUTES) {
      if (hasPermission(route.permission)) {
        navigate(route.path, { replace: true })
        return
      }
    }

    navigate("/settings/organization", { replace: true })
  }, [navigate, hasPermission, isLoading, policy])

  return null
}
