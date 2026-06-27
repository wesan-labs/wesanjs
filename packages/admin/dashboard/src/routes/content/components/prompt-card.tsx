import { Text, clx } from "@medusajs/ui"
import { PromptListItem } from "../../../hooks/api/content"
import { PlatformGlyph, modeMeta, typeMeta } from "./prompt-meta"

/**
 * One prompt as a fixed-width card in the horizontal strip. Leads with the
 * content-type icon (what it makes), the title, and a peek at the REAL prompt
 * so the user judges it before selecting — no jargon badges.
 */
export const PromptCard = ({
  item,
  preview,
  selected,
  index,
  onClick,
}: {
  item: PromptListItem
  /** filled one-line peek at the template */
  preview: string
  selected: boolean
  index: number
  onClick: () => void
}) => {
  const { Icon, label } = typeMeta(item.content_type)
  const showMode = item.content_type === "image-prompt"
  const isTransform = item.mode === "transform"
  const ModeIcon = modeMeta(item.mode).Icon
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.goal}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
      className={clx(
        "animate-in fade-in-0 slide-in-from-right-2 fill-mode-both group relative flex w-[208px] shrink-0 snap-start flex-col gap-y-2 rounded-xl border p-3 text-left transition-all duration-150 ease-out motion-reduce:animate-none motion-reduce:transition-none",
        selected
          ? "border-ui-border-interactive bg-ui-bg-base shadow-borders-interactive-with-active"
          : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base hover:-translate-y-0.5 hover:shadow-elevation-card-rest"
      )}
    >
      <div className="flex items-center gap-x-2">
        <div
          className={clx(
            "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            selected
              ? "bg-ui-bg-interactive text-ui-fg-on-color"
              : "bg-ui-bg-base text-ui-fg-subtle group-hover:text-ui-fg-base"
          )}
        >
          <Icon />
        </div>
        <div className="text-ui-fg-muted flex min-w-0 items-center gap-x-1.5">
          <PlatformGlyph platform={item.platform} className="size-3 shrink-0" />
          <Text size="xsmall" className="truncate uppercase tracking-wide">
            {label}
          </Text>
        </div>
        {showMode && (
          <span
            title={modeMeta(item.mode).label}
            className={clx(
              "ml-auto flex size-5 shrink-0 items-center justify-center rounded-md",
              isTransform
                ? "bg-ui-tag-blue-bg text-ui-tag-blue-icon"
                : "bg-ui-bg-subtle text-ui-fg-muted"
            )}
          >
            <ModeIcon />
          </span>
        )}
      </div>

      <Text size="small" weight="plus" className="line-clamp-2 leading-snug">
        {item.title}
      </Text>
      {showMode && (
        <Text
          size="xsmall"
          className={clx(
            "-mt-0.5 font-medium",
            isTransform ? "text-ui-tag-blue-text" : "text-ui-fg-muted"
          )}
        >
          {isTransform ? "📱 Görselini kullanır" : "🎨 Sıfırdan üretir"}
        </Text>
      )}

      <Text
        size="xsmall"
        className="text-ui-fg-muted border-ui-border-base bg-ui-bg-base/60 line-clamp-3 rounded-md border p-1.5 font-mono leading-relaxed"
      >
        {preview}
      </Text>
    </button>
  )
}
