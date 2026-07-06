import { Fragment, ReactNode } from "react"

/** Grid footprint for `core:dashboard-grid` (4-column xl track). */
export type EntryTileSpan =
  | "full"
  | "kpi"
  | "hero-left"
  | "hero-right"
  | "wide"
  | "narrow"

/** Stretch card children to the grid cell height in view mode. */
export const ENTRY_TILE_STRETCH = "h-full min-h-0 [&>*]:h-full"

/** View-mode column spans — parent is `xl:grid-cols-4`. */
export const ENTRY_TILE_CLASS: Record<EntryTileSpan, string> = {
  full: "col-span-full",
  kpi: "col-span-1",
  "hero-left": "col-span-full xl:col-span-3",
  "hero-right": "col-span-full xl:col-span-1",
  wide: "col-span-full xl:col-span-3",
  narrow: "col-span-full xl:col-span-1",
}

export type LayoutEntryProps = {
  /** Stable identity for this entry. Survives component renames and minification. */
  id: string
  /** Human-readable label shown in customize mode instead of the raw widget id. */
  label?: string
  /** Column span when the page uses `core:dashboard-grid`. */
  tile?: EntryTileSpan
  children: ReactNode
}

/**
 * Pins a stable identity to a layout entry. Tile spans are applied at render
 * time by `LayoutComposer` — not here — so edit mode can use a flat list.
 */
export function LayoutEntry({ children }: LayoutEntryProps) {
  return <Fragment>{children}</Fragment>
}

LayoutEntry.displayName = "LayoutEntry"
