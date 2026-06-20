import { Badge, Text } from "@medusajs/ui"
import { useOrders } from "../../../hooks/api/orders"
import { useDate } from "../../../hooks/use-date"
import { Column, DataTable, Money } from "../../dashboards/kit"

type OrderRow = {
  id: string
  display_id?: number
  email?: string | null
  status?: string
  total?: number
  currency_code?: string
  created_at?: string
}

export const RecentOrders = () => {
  const { getFullDate } = useDate()
  const { orders = [], isLoading } = useOrders({
    limit: 8,
    order: "-created_at",
    fields: "id,display_id,email,status,total,currency_code,created_at",
  })

  const columns: Column<OrderRow>[] = [
    {
      key: "id",
      header: "#",
      render: (o) => <Text size="small">#{o.display_id ?? "—"}</Text>,
    },
    {
      key: "email",
      header: "Müşteri",
      render: (o) => (
        <Text size="small" className="text-ui-fg-subtle">
          {o.email ?? "—"}
        </Text>
      ),
    },
    {
      key: "date",
      header: "Tarih",
      render: (o) => (
        <Text size="small" className="text-ui-fg-subtle">
          {o.created_at ? getFullDate({ date: o.created_at }) : "—"}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Durum",
      render: (o) => <Badge size="2xsmall">{o.status ?? "—"}</Badge>,
    },
    {
      key: "total",
      header: "Tutar",
      align: "right",
      render: (o) => <Money amount={o.total} currency={o.currency_code} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={(orders ?? []) as OrderRow[]}
      isLoading={isLoading}
      emptyLabel="Henüz sipariş yok"
    />
  )
}
