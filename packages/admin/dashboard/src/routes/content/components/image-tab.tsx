import { ChevronDownMini, Photo, SquaresPlus } from "@medusajs/icons"
import { Button, Text } from "@medusajs/ui"
import { EditPanel } from "./edit-panel"
import { QuickActions } from "./quick-actions"

type Source = { data: string; mime: string }

/** "free" = quick-edit tools in the rail; "library" = the bottom prompt gallery. */
export type ImageMethod = "free" | "library"

/**
 * Görsel tab — the right-rail workspace. One coherent "Hızlı düzenle" tool
 * (one-tap presets + free edit) that only appears once there's an image, plus a
 * single toggle opening the full prompt gallery. No disabled-control wall.
 */
export const ImageTab = ({
  source,
  onApply,
  onResult,
  busy,
  hasImage,
  setMethod,
}: {
  source?: Source
  onApply: (prompt: string) => Promise<void>
  onResult: (dataUrl: string, label: string) => void
  busy: boolean
  hasImage: boolean
  method: ImageMethod
  setMethod: (m: ImageMethod) => void
}) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Button variant="secondary" onClick={() => setMethod("library")}>
        <SquaresPlus />
        Hazır prompt galerisi
        <ChevronDownMini className="ml-auto" />
      </Button>

      {hasImage ? (
        <>
          <QuickActions
            source={source}
            onApply={onApply}
            onResult={onResult}
            hasImage={hasImage}
            busy={busy}
          />
          <div className="border-t pt-4">
            <EditPanel onApply={onApply} busy={busy} />
          </div>
        </>
      ) : (
        <div className="border-ui-border-base text-ui-fg-subtle flex items-start gap-x-2 rounded-lg border border-dashed p-4">
          <Photo className="text-ui-fg-muted mt-0.5 shrink-0" />
          <Text size="small">
            Soldan bir görsel ekle — hızlı düzenle ve serbest düzenleme burada
            açılır. Ya da yukarıdan hazır prompt galerisine göz at.
          </Text>
        </div>
      )}
    </div>
  )
}
