import { ArrowDownLeftMini } from "@medusajs/icons"
import { Text, clx } from "@medusajs/ui"
import { ContentBrief, ContentVariant } from "../../../hooks/api/content"
import { GuideBanner, MethodToggle } from "./panel-chrome"
import { TextPanel } from "./text-panel"

type Source = { data: string; mime: string }

export type TextMethod = "quick" | "library"

/**
 * Metin tab — right-rail controls. Quick caption stays here; the "Hazır prompt"
 * gallery lives in the full-width bottom dock (so it shows a pointer here).
 */
export const TextTab = ({
  source,
  languages,
  onBrief,
  hasImage,
  method,
  setMethod,
}: {
  source?: Source
  languages: string[]
  onBrief: (b: {
    language: string
    brief: ContentBrief
    variants: ContentVariant[]
  }) => void
  hasImage: boolean
  method: TextMethod
  setMethod: (m: TextMethod) => void
}) => {
  return (
    <div className="flex flex-col gap-y-4">
      {!hasImage && method === "quick" && (
        <GuideBanner
          n={1}
          text="Hızlı caption görselden üretir — soldan bir görsel ekle."
        />
      )}

      <MethodToggle
        value={method}
        onChange={(v) => setMethod(v as TextMethod)}
        options={[
          ["quick", "Hızlı"],
          ["library", "Hazır prompt"],
        ]}
      />

      <div className={clx(method !== "quick" && "hidden")}>
        <TextPanel
          source={source}
          languages={languages}
          onBrief={onBrief}
          disabled={!hasImage}
        />
      </div>
      {method === "library" && (
        <div className="border-ui-border-base text-ui-fg-subtle flex items-center gap-x-2 rounded-lg border border-dashed p-3">
          <ArrowDownLeftMini className="shrink-0" />
          <Text size="small">
            Hazır prompt galerisi aşağıda — bir prompt seç, doldur, üret.
          </Text>
        </div>
      )}
    </div>
  )
}
