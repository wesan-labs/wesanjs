import { Trash, XMarkMini } from "@medusajs/icons"
import { Text, toast } from "@medusajs/ui"
import { FileType, FileUpload } from "../../../components/common/file-upload/file-upload"

/** Dosya → downscale'li data-URL (canvas; başarısızsa ham FileReader). Bulletproof. Reusable. */
export const fileToDataUrl = (file: File, maxDim = 2000): Promise<string> =>
  new Promise((resolve) => {
    const raw = () => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => resolve("")
      r.readAsDataURL(file)
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height || 1))
        const c = document.createElement("canvas")
        c.width = Math.max(1, Math.round(img.width * scale))
        c.height = Math.max(1, Math.round(img.height * scale))
        const ctx = c.getContext("2d")
        URL.revokeObjectURL(url)
        if (!ctx) return raw()
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL("image/jpeg", 0.85))
      } catch {
        raw()
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      raw()
    }
    img.src = url
  })

/** Kapsama eşikleri — reconstruction kalitesi için (kanıt-temelli). */
export const MIN_PHOTOS = 4
export const GOOD_PHOTOS = 6

/** Foto sayısına göre 3D-hazırlık. Saf, reusable. */
export const coverage = (n: number): { pct: number; color: "red" | "orange" | "green"; label: string } => {
  if (n === 0) return { pct: 0, color: "red", label: "En az 4 açı gerekli" }
  if (n < MIN_PHOTOS) return { pct: (n / GOOD_PHOTOS) * 100, color: "red", label: `${n} açı — çok az, daha fazla ekle` }
  if (n < GOOD_PHOTOS) return { pct: (n / GOOD_PHOTOS) * 100, color: "orange", label: `${n} açı — olur, ama 6+ daha iyi` }
  return { pct: 100, color: "green", label: `${n} açı — 3D'ye hazır ✓` }
}

const BAR: Record<"red" | "orange" | "green", string> = {
  red: "bg-ui-tag-red-icon",
  orange: "bg-ui-tag-orange-icon",
  green: "bg-ui-tag-green-icon",
}

/**
 * Controlled çoklu-foto yönetimi — upload → data-URL, thumbnail ızgarası, kaldır,
 * opsiyonel kapsama çubuğu. Reusable (studio girdi + 3D panel). Değeri parent tutar.
 */
export const PhotoSet = ({
  photos,
  onChange,
  showCoverage = false,
  disabled = false,
  label = "Ürün fotoğraflarını sürükle ya da seç",
}: {
  photos: string[]
  onChange: (next: string[]) => void
  showCoverage?: boolean
  disabled?: boolean
  label?: string
}) => {
  const addFiles = async (files: FileType[]) => {
    if (!files?.length) return
    try {
      const added = (await Promise.all(files.map((f) => fileToDataUrl(f.file)))).filter(Boolean)
      if (!added.length) return toast.error("Foto okunamadı")
      onChange([...photos, ...added])
      toast.success(`${added.length} foto eklendi`)
    } catch (e) {
      toast.error("Foto eklenemedi", { description: String((e as Error)?.message ?? e) })
    }
  }
  const cov = coverage(photos.length)

  return (
    <div className="flex flex-col gap-y-3">
      <FileUpload
        label={label}
        hint="JPEG, PNG, WebP · birden fazla (farklı açılar)"
        multiple
        formats={["image/jpeg", "image/png", "image/webp"]}
        maxFileSize={Infinity}
        onUploaded={addFiles}
      />

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative">
              <img src={p} alt={`açı ${i + 1}`} className="border-ui-border-base size-16 rounded-md border object-cover" />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                className="bg-ui-bg-base border-ui-border-base absolute -right-1.5 -top-1.5 rounded-full border p-0.5 shadow-sm"
              >
                <XMarkMini />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([])}
            className="text-ui-fg-muted hover:text-ui-fg-base flex size-16 flex-col items-center justify-center gap-y-0.5 rounded-md border border-dashed"
          >
            <Trash />
            <span className="text-[10px]">Temizle</span>
          </button>
        </div>
      )}

      {showCoverage && (
        <div className="flex flex-col gap-y-1">
          <div className="bg-ui-bg-base h-1.5 w-full overflow-hidden rounded-full">
            <div className={`h-full rounded-full transition-all ${BAR[cov.color]}`} style={{ width: `${cov.pct}%` }} />
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle">
            {cov.label}
          </Text>
        </div>
      )}
    </div>
  )
}
