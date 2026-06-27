import { TrianglesMini } from "@medusajs/icons"
import { DropdownMenu, clx } from "@medusajs/ui"

export interface MultiOption {
  value: string
  label: string
  glyph?: React.ReactNode
}

/**
 * A multi-select box: a Select-like trigger that opens a checkbox dropdown
 * (portaled, so it never clips inside scrolling panels). Stays open across
 * picks. Controlled via a Set of selected values.
 */
export const MultiSelect = ({
  placeholder,
  options,
  selected,
  onToggle,
}: {
  placeholder: string
  options: MultiOption[]
  selected: Set<string>
  onToggle: (value: string) => void
}) => {
  const chosen = options.filter((o) => selected.has(o.value))
  const summary =
    chosen.length === 0
      ? placeholder
      : chosen.length <= 2
        ? chosen.map((o) => o.label).join(", ")
        : `${chosen.length} seçili`

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={clx(
            "bg-ui-bg-field hover:bg-ui-bg-field-hover border-ui-border-base shadow-borders-base txt-compact-small flex h-8 w-full items-center justify-between gap-x-2 rounded-md border px-2 transition-fg outline-none",
            chosen.length === 0 && "text-ui-fg-muted"
          )}
        >
          <span className="truncate">{summary}</span>
          <TrianglesMini className="text-ui-fg-muted shrink-0" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="z-50 max-h-72 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
        {options.map((o) => (
          <DropdownMenu.CheckboxItem
            key={o.value}
            checked={selected.has(o.value)}
            onCheckedChange={() => onToggle(o.value)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex items-center gap-x-2">
              {o.glyph}
              {o.label}
            </span>
          </DropdownMenu.CheckboxItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
