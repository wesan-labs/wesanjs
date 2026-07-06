import { Spinner } from "@medusajs/icons"
import { Suspense, lazy } from "react"

/**
 * Filerobot görsel editörü — AI çıktısını yayın öncesi manuel rötuş (crop,
 * aspect preset, text, logo, filtre, annotate). ~185KB → LAZY: yalnızca editör
 * açılınca yüklenir (Vite otomatik code-split eder, ana bundle şişmez).
 *
 * Data akışı Gemini şekliyle aynı: source=dataURL girer, onSave imageBase64
 * (data URL) döner → yeni versiyon olarak eklenir.
 */
const FilerobotImageEditor = lazy(() => import("react-filerobot-image-editor"))

const CROP_PRESETS = [
  { titleKey: "original" },
  { titleKey: "square", ratio: 1, descriptionKey: "1:1" },
  { titleKey: "feed", ratio: 4 / 5, descriptionKey: "4:5" },
  { titleKey: "story", ratio: 9 / 16, descriptionKey: "9:16" },
  { titleKey: "wide", ratio: 16 / 9, descriptionKey: "16:9" },
]

export const ImageEditor = ({
  source,
  onSave,
  onClose,
}: {
  /** düzenlenecek görselin data URL'i */
  source: string
  /** düzenlenmiş görsel (data URL) → yeni versiyon */
  onSave: (dataUrl: string) => void
  onClose: () => void
}) => (
  <div className="bg-ui-bg-base fixed inset-0 z-50 flex flex-col">
    <Suspense
      fallback={
        <div className="text-ui-fg-subtle flex flex-1 items-center justify-center gap-x-2">
          <Spinner className="animate-spin" />
          Editör yükleniyor…
        </div>
      }
    >
      <FilerobotImageEditor
        source={source}
        onSave={(edited: { imageBase64?: string }) => {
          if (edited.imageBase64) {
            onSave(edited.imageBase64)
          }
        }}
        onClose={onClose}
        savingPixelRatio={2}
        previewPixelRatio={2}
        Crop={{ presetsItems: CROP_PRESETS }}
      />
    </Suspense>
  </div>
)
