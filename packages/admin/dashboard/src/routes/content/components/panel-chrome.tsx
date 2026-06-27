import { ArrowRightMini } from "@medusajs/icons"
import { Text, clx } from "@medusajs/ui"
import { Fragment } from "react"

/** Segmented method switch (e.g. Serbest · Hazır prompt). One method visible at a time → lower cognitive load. */
export const MethodToggle = ({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) => (
  <div
    className="bg-ui-bg-subtle grid gap-0.5 rounded-lg p-0.5"
    style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
  >
    {options.map(([v, label]) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        className={clx(
          "txt-compact-small-plus rounded-md px-3 py-1.5 transition-all duration-150 ease-out",
          value === v
            ? "bg-ui-bg-base text-ui-fg-base shadow-borders-base"
            : "text-ui-fg-subtle hover:text-ui-fg-base"
        )}
      >
        {label}
      </button>
    ))}
  </div>
)

/** Dashed status row that ties the panel to a precondition (e.g. add an image first). */
export const GuideBanner = ({ n, text }: { n: number; text: string }) => (
  <div className="border-ui-border-strong bg-ui-bg-subtle animate-in fade-in-0 slide-in-from-top-1 flex items-center gap-x-2.5 rounded-lg border border-dashed p-3 duration-200 motion-reduce:animate-none">
    <span className="bg-ui-bg-base border-ui-border-base text-ui-fg-muted flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium">
      {n}
    </span>
    <Text size="small" className="text-ui-fg-subtle">
      {text}
    </Text>
  </div>
)

/** Compact 1 → 2 → 3 progress so a multi-step flow reads as a sequence. */
export const StepStrip = ({
  step,
  labels,
}: {
  step: number
  labels: string[]
}) => (
  <div className="flex items-center gap-x-1.5">
    {labels.map((l, i) => {
      const active = i + 1 <= step
      return (
        <Fragment key={l}>
          <span
            className={clx(
              "flex items-center gap-x-1 text-xs transition-colors duration-150",
              i + 1 === step
                ? "text-ui-fg-base font-medium"
                : active
                  ? "text-ui-fg-subtle"
                  : "text-ui-fg-muted"
            )}
          >
            <span
              className={clx(
                "flex size-4 items-center justify-center rounded-full text-[10px] transition-colors duration-150",
                i + 1 === step
                  ? "bg-ui-tag-blue-bg text-ui-tag-blue-text"
                  : "bg-ui-bg-subtle text-ui-fg-muted"
              )}
            >
              {i + 1}
            </span>
            {l}
          </span>
          {i < labels.length - 1 && (
            <ArrowRightMini className="text-ui-fg-muted size-3.5" />
          )}
        </Fragment>
      )
    })}
  </div>
)
