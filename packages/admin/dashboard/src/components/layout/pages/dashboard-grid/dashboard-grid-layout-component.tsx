import type { ReactElement } from "react"
import { LayoutComponentProps } from "../../../layout-composer/types"

/**
 * Responsive 4-column dashboard grid. Same layout in view and customize mode
 * so KPI rows, hero pairs, and wide/narrow widgets keep their positions.
 */
export const DashboardGridLayoutComponent = ({
  sections,
}: LayoutComponentProps): ReactElement => {
  return (
    <div className="grid grid-cols-2 items-stretch gap-2 xl:grid-cols-4">
      {sections["main"]}
    </div>
  )
}
