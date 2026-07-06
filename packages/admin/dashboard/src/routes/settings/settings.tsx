import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

export const Settings = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === "/settings") {
      navigate("/settings/store", {
        replace: true,
        // Preserve customize/menu state (e.g. settings sidebar customizer).
        state: location.state,
      })
    }
  }, [location.pathname, location.state, navigate])

  return <Outlet />
}
