import { CheckCircleSolid, Photo, Sparkles, Spinner } from "@medusajs/icons"
import { Button, Text } from "@medusajs/ui"
import { PackShot, useCompose } from "../../../hooks/api/content"

/**
 * Deterministik önizleme paneli — shot seçilince `POST /compose` çağırır,
 * ÜRETİLECEK talimatı aynen gösterir (LLM yok, "örnek" butonu yok). Üret,
 * bu instruction'ı tek hop olarak edit-image'e verir. Bega Home'un
 * "seç → kontrol et → üret" mantığı.
 *
 * Not: parent bu component'i `key={shot.id}` ile mount ettiği için shot
 * değişince compose durumu sıfırlanır.
 */
export const ShotPreview = ({
  packId,
  categoryId,
  shot,
  label,
  metadata,
  hasImage,
  busy,
  onGenerate,
}: {
  packId: string
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
  const instruction = composeMut.data?.instruction
  const errMsg =
    composeMut.error instanceof Error ? composeMut.error.message : null

  const check = () =>
    composeMut.mutate({ packId, categoryId, shotId: shot.id, metadata })

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

      <Button
        variant="secondary"
        size="small"
        onClick={check}
        disabled={composeMut.isPending}
        className="self-start"
      >
        {composeMut.isPending ? <Spinner className="animate-spin" /> : <Sparkles />}
        Kontrol et (önizle)
      </Button>

      {errMsg && (
        <Text size="xsmall" className="text-ui-fg-error">
          {errMsg}
        </Text>
      )}

      {instruction && (
        <>
          <div className="border-ui-border-base bg-ui-bg-subtle max-h-40 overflow-y-auto rounded-md border p-2">
            <Text size="xsmall" className="text-ui-fg-subtle whitespace-pre-wrap">
              {instruction}
            </Text>
          </div>
          <div className="flex items-center gap-x-2">
            <CheckCircleSolid className="text-ui-tag-green-icon shrink-0" />
            <Text size="xsmall" className="text-ui-fg-subtle">
              Deterministik — aynı seçim her zaman bu talimatı verir.
            </Text>
          </div>
          <Button
            size="small"
            onClick={() => onGenerate(instruction, label)}
            disabled={busy || !hasImage}
            className="self-start"
          >
            {busy ? <Spinner className="animate-spin" /> : <Photo />}
            {hasImage ? "Üret" : "Önce görsel yükle"}
          </Button>
        </>
      )}
    </div>
  )
}
