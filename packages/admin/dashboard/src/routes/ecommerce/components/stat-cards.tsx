import { useCustomerGroups } from "../../../hooks/api/customer-groups"
import { useCustomers } from "../../../hooks/api/customers"
import { useOrders } from "../../../hooks/api/orders"
import { useProducts } from "../../../hooks/api/products"
import { MetricGrid } from "../../dashboards/kit"

const fmt = (n?: number) => (n ?? 0).toLocaleString()

export const StatCards = () => {
  // Stat kartları "bedava": liste endpoint'leri count döndürüyor, limit:1 yeter.
  const { count: orderCount } = useOrders({ limit: 1 })
  const { count: productCount } = useProducts({ limit: 1 })
  const { count: customerCount } = useCustomers({ limit: 1 })
  const { count: groupCount } = useCustomerGroups({ limit: 1 })

  return (
    <MetricGrid
      metrics={[
        { label: "Siparişler", value: fmt(orderCount), sub: "Toplam" },
        { label: "Ürünler", value: fmt(productCount), sub: "Katalog" },
        { label: "Müşteriler", value: fmt(customerCount), sub: "Toplam" },
        { label: "Müşteri Grupları", value: fmt(groupCount), sub: "Aktif" },
      ]}
    />
  )
}
