import { MagnifyingGlass, Sparkles } from "@medusajs/icons"
import { Badge, Text } from "@medusajs/ui"
import { ContentBrief } from "../../../hooks/api/content"
import { CopyButton } from "./copy-button"

const Field = ({
  label,
  value,
  copy,
}: {
  label: string
  value: string
  copy?: boolean
}) => (
  <div className="flex flex-col gap-y-1">
    <div className="flex items-center justify-between">
      <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">
        {label}
      </Text>
      {copy ? <CopyButton value={value} /> : null}
    </div>
    <Text size="small" className="text-ui-fg-base whitespace-pre-wrap">
      {value}
    </Text>
  </div>
)

/**
 * Renders the AI-generated creative brief: scene analysis, the hook/body/CTA
 * script, and a reusable visual prompt. Platform-agnostic — the "yani prompt"
 * layer the user asked for.
 */
export const BriefCard = ({ brief }: { brief: ContentBrief }) => {
  return (
    <div className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-y-4 rounded-xl border p-5">
      <div className="flex items-center gap-x-2">
        <Sparkles className="text-ui-fg-interactive" />
        <Text weight="plus">İçerik Brief'i</Text>
        <Badge size="2xsmall" color="purple" className="ml-auto">
          Script + Prompt
        </Badge>
      </div>

      <div className="bg-ui-bg-component border-ui-border-base flex items-start gap-x-2 rounded-lg border p-3">
        <MagnifyingGlass className="text-ui-fg-muted mt-0.5 shrink-0" />
        <Text size="small" className="text-ui-fg-subtle">
          {brief.scene_analysis}
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Field label="Hook" value={brief.hook} copy />
        <Field label="Gövde" value={brief.body} copy />
        <Field label="CTA" value={brief.cta} copy />
      </div>

      <div className="bg-ui-tag-purple-bg border-ui-tag-purple-border flex flex-col gap-y-1 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Text size="xsmall" weight="plus" className="text-ui-tag-purple-text uppercase">
            Yeniden-üretim prompt'u
          </Text>
          <CopyButton value={brief.reusable_prompt} label="Prompt'u kopyala" />
        </div>
        <Text size="small" className="text-ui-fg-base whitespace-pre-wrap">
          {brief.reusable_prompt}
        </Text>
      </div>
    </div>
  )
}
