/**
 * Single source for client-side background removal (@imgly, free, in-browser).
 * Both the QuickActions chip and the BackgroundPanel call this — one place to
 * tune quality/format so the two never drift.
 *
 * The heavy WASM model is dynamic-imported on first use (kept out of the main
 * bundle). `output.format: image/png` is set explicitly so the result always
 * carries an alpha channel (transparent), never a flattened background.
 *
 * Quality dial — `model`:
 *   "small"  → isnet_quint8 (fastest, softest edges)
 *   "medium" → isnet_fp16  (default; balanced, ~44MB)   ← current
 *   "large"  → isnet       (cleanest edges: hair/fabric fuzz, ~176MB first load)
 * Bump to "large" for maximum edge quality at the cost of a bigger first-use
 * download. Left at the library default (medium) unless a call overrides it.
 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export type BgQuality = "small" | "medium" | "large"

/** Quality alias → @imgly model id (the config type wants the concrete enum). */
const MODEL_BY_QUALITY = {
  small: "isnet_quint8",
  medium: "isnet_fp16",
  large: "isnet",
} as const

export const removeImageBackground = async (
  source: { data: string; mime: string },
  quality: BgQuality = "medium"
): Promise<string> => {
  const { removeBackground } = await import("@imgly/background-removal")
  const blob = await removeBackground(`data:${source.mime};base64,${source.data}`, {
    model: MODEL_BY_QUALITY[quality],
    output: { format: "image/png" },
  })
  return blobToDataUrl(blob)
}
