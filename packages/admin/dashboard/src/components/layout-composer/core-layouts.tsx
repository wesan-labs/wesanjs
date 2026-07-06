import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { LayoutDefinition } from "./types"
import {
  DashboardGridLayoutComponent,
  SingleColumnLayoutComponent,
  SingleRowLayoutComponent,
  TwoColumnLayoutComponent,
} from "../layout/pages"
import { SettingsSidebarLayoutComponent } from "../layout/settings-layout/settings-sidebar-layout-component"

export const CORE_LAYOUTS: LayoutDefinition[] = [
  {
    id: CORE_LAYOUT_IDS.SINGLE_COLUMN,
    sections: [{ id: "main", ordering: "list" }],
    Component: SingleColumnLayoutComponent,
  },
  {
    id: CORE_LAYOUT_IDS.SINGLE_ROW,
    sections: [{ id: "main", ordering: "horizontal-list" }],
    Component: SingleRowLayoutComponent,
  },
  {
    id: CORE_LAYOUT_IDS.TWO_COLUMN,
    sections: [
      { id: "main", ordering: "list" },
      { id: "side", ordering: "list" },
    ],
    Component: TwoColumnLayoutComponent,
  },
  {
    id: CORE_LAYOUT_IDS.DASHBOARD_GRID,
    sections: [{ id: "main", ordering: "grid" }],
    Component: DashboardGridLayoutComponent,
  },
  {
    id: CORE_LAYOUT_IDS.SETTINGS_SIDEBAR,
    sections: [
      { id: "organization", ordering: "list" },
      { id: "general", ordering: "list" },
      { id: "developer", ordering: "list" },
      { id: "myAccount", ordering: "list" },
      { id: "extensions", ordering: "list" },
    ],
    Component: SettingsSidebarLayoutComponent,
  },
]
