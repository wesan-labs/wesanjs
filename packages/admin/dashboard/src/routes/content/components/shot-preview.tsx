import { CheckCircleSolid, Photo, Spinner } from "@medusajs/icons"
import { Button, Text, clx } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { BrandIdentity, PackShot, useCompose } from "../../../hooks/api/content"

/**
 * Deterministik önizleme + üret. Çekim seçilince compose OTOMATİK çalışır
 * (ayrı "Kontrol et" adımı yok — "seç → üret"); talimat default katlı, "Üret"
 * doğrudan aktif. metadata değişince (debounced) yeniden derlenir.
 *
 * Parent bu component'i `key={shot.id}` ile mount ettiği için shot değişince
 * compose durumu sıfırlanır.
 */
export const ShotPreview = ({
  packId,
  brand,
  categoryId,
  shot,
  label,
  metadata,
  hasImage,
  busy,
  onGenerate,
}: {
  packId: string
  /** verilirse derleyici yolu: markayı derle (cache'li) → compose (packId yok sayılır) */
  brand?: BrandIdentity
  categoryId: string
  shot: PackShot
  /** üretilen versiyonun etiketi, ör. "Zigon · Yaşam alanı" */
  label: string
  metadata: Record<string, string>
  hasImage: boolean
  busy: boolean
  onGenerate: (instruction: string, label: string) => void
}) => {
  const composeMut = useCompose()
  const [showInstruction, setShowInstruction] = useState(false)
  const instruction = composeMut.data?.instruction
  const rawErr = composeMut.error instanceof Error ? composeMut.error.message : null
  // Eksik metadata (Unresolved token) → korkutucu hata yerine nazik ipucu.
  const hint = rawErr?.includes("Unresolved token")
    ? "Yukarıdaki detayları doldur — eksik alan var."
    : rawErr

  // Otomatik compose (debounced) — metadata/shot değişince yeniden derle.
  const metaKey = JSON.stringify(metadata)
  const brandKey = brand ? `${brand.id}@${brand.version}` : ""
  useEffect(() => {
    const t = setTimeout(() => {
      composeMut.mutate(
        brand
          ? { brand, categoryId, shotId: shot.id, metadata }
          : { packId, categoryId, shotId: shot.id, metadata }
      )
    }, 350)
    return () => clearTimeout(t)
    // composeMut react-query'de stabil; metaKey/shot/brand değişimi tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaKey, shot.id, packId, categoryId, brandKey])

  return (
    <div className="border-ui-border-base flex flex-col gap-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-x-2">
        <Text size="small" weight="plus">
          {shot.label}
        </Text>
        <span className="text-ui-fg-muted bg-ui-bg-subtle rounded px-1.5 py-0.5 text-xs">
          {shot.mode === "transform" ? "görselini kullanır" : "sıfırdan üretir"}
        </span>
        <span className="text-ui-fg-muted ml-auto text-xs">{shot.aspect}</span>
      </div>

      {composeMut.isPending && (
        <div className="text-ui-fg-subtle flex items-center gap-x-2">
          <Spinner className="animate-spin" />
          <Text size="xsmall">Talimat hazırlanıyor…</Text>
        </div>
      )}

      {hint && (
        <Text size="xsmall" className="text-ui-fg-error">
          {hint}
        </Text>
      )}

      {instruction && (
        <>
          <Button
            size="small"
            onClick={() => onGenerate(instruction, label)}
            disabled={busy || !hasImage}
            className="self-start"
          >
            {busy ? <Spinner className="animate-spin" /> : <Photo />}
            {hasImage ? "Üret" : "Önce görsel yükle"}
          </Button>

          <div className="flex items-center gap-x-1.5">
            <CheckCircleSolid className="text-ui-tag-green-icon shrink-0" />
            <Text size="xsmall" className="text-ui-fg-subtle">
              Deterministik — aynı seçim her zaman aynı talimatı verir.
            </Text>
            <button
              type="button"
              onClick={() => setShowInstruction((s) => !s)}
              className="text-ui-fg-muted hover:text-ui-fg-base ml-auto text-xs"
            >
              {showInstruction ? "Talimatı gizle" : "Talimatı gör"}
            </button>
          </div>

          <div
            className={clx(
              "border-ui-border-base bg-ui-bg-subtle overflow-y-auto rounded-md border p-2",
              showInstruction ? "max-h-40" : "hidden"
            )}
          >
            <Text size="xsmall" className="text-ui-fg-subtle whitespace-pre-wrap">
              {instruction}
            </Text>
          </div>
        </>
      )}
    </div>
  )
}
