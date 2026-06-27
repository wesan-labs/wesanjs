import { Clock } from "@medusajs/icons"
import { Badge, Text } from "@medusajs/ui"
import { ContentVariant } from "../../../hooks/api/content"
import { CopyButton } from "./copy-button"
import { PlatformGlyph } from "./prompt-meta"

/**
 * One platform+format-tailored post: caption, hashtag set, alt-text, time.
 * The "yayına hazır" output layer derived from the brief.
 */
export const VariantCard = ({ variant }: { variant: ContentVariant }) => {
  const fullCaption = `${variant.caption}\n\n${variant.hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ")}`

  return (
    <div className="border-ui-border-base flex flex-col gap-y-4 rounded-xl border p-5">
      <div className="flex items-center gap-x-2">
        <PlatformGlyph
          platform={variant.platform}
          className="text-ui-fg-subtle size-4 shrink-0"
        />
        <Text weight="plus">{variant.label}</Text>
        <div className="text-ui-fg-muted ml-auto flex items-center gap-x-1">
          <Clock />
          <Text size="xsmall">{variant.suggested_time}</Text>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <div className="flex items-center justify-between">
          <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">
            Caption
          </Text>
          <CopyButton value={fullCaption} label="Caption + hashtag kopyala" />
        </div>
        <Text size="small" className="text-ui-fg-base whitespace-pre-wrap">
          {variant.caption}
        </Text>
      </div>

      <div className="flex flex-wrap gap-1">
        {variant.hashtags.map((tag) => (
          <Badge key={tag} size="2xsmall" color="grey">
            {tag.startsWith("#") ? tag : `#${tag}`}
          </Badge>
        ))}
      </div>

      <div className="border-ui-border-base flex items-start gap-x-2 border-t pt-3">
        <Text size="xsmall" weight="plus" className="text-ui-fg-muted mt-0.5 uppercase">
          Alt
        </Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {variant.alt_text}
        </Text>
      </div>
    </div>
  )
}
