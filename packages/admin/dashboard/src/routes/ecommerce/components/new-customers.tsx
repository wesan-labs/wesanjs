import { useCustomers } from "../../../hooks/api/customers"
import { useDate } from "../../../hooks/use-date"
import { ListItem, ListPanel } from "../../dashboards/kit"

type CustomerLike = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string
  created_at?: string
}

export const NewCustomers = () => {
  const { getFullDate } = useDate()
  const { customers = [], isLoading } = useCustomers({
    limit: 6,
    order: "-created_at",
    fields: "id,first_name,last_name,email,created_at",
  })

  const items: ListItem[] = (customers as CustomerLike[]).map((c) => {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ")
    return {
      id: c.id,
      title: name || c.email || "—",
      subtitle: name ? c.email : undefined,
      meta: c.created_at ? getFullDate({ date: c.created_at }) : undefined,
      fallback: (c.first_name?.[0] || c.email?.[0] || "?").toUpperCase(),
    }
  })

  return (
    <ListPanel
      items={items}
      isLoading={isLoading}
      emptyLabel="Henüz müşteri yok"
    />
  )
}
