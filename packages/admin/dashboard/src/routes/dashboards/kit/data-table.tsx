import { Table, clx } from "@medusajs/ui"
import { ReactNode } from "react"
import { EmptyState } from "./states"

export type Column<T> = {
  key: string
  header: string
  align?: "left" | "right"
  render: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  isLoading?: boolean
  emptyLabel?: string
}

// Jenerik dashboard tablosu: @medusajs/ui Table üstünde ince sarmalayıcı.
// columns + rows ver, gerisini halleder. Recent orders / best-selling / vb.
export const DataTable = <T,>({
  columns,
  rows,
  isLoading,
  emptyLabel = "Kayıt yok",
}: DataTableProps<T>) => {
  if (!isLoading && rows.length === 0) {
    return <EmptyState label={emptyLabel} />
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {columns.map((col) => (
            <Table.HeaderCell
              key={col.key}
              className={clx(col.align === "right" && "text-right")}
            >
              {col.header}
            </Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row, index) => (
          <Table.Row key={index}>
            {columns.map((col) => (
              <Table.Cell
                key={col.key}
                className={clx(col.align === "right" && "text-right")}
              >
                {col.render(row)}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
