import { Buildings, Spinner } from "@medusajs/icons"
import { Input, Text, clx } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { PackSummary, usePacks } from "../../../hooks/api/content"
import { BrandProfile } from "./brand-profile"
import { ShotPreview } from "./shot-preview"

/** Tek satır seçim chip'i (sektör / kategori / shot). */
const Chip = ({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clx(
      "flex shrink-0 snap-start items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-100",
      active
        ? "border-ui-border-interactive bg-ui-bg-base text-ui-fg-base shadow-borders-base"
        : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base"
    )}
  >
    {label}
  </button>
)

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex snap-x gap-x-2 overflow-x-auto pb-1">{children}</div>
)

/**
 * Pack-first görsel seçici: sektör → kategori → shot. 119 kartlık şerit yerine
 * kategori başına 4-5 anlamlı "çıktı tipi". Shot seçilince deterministik
 * önizleme (compose) gösterilir; Üret tek hop edit-image'e gider.
 *
 * Metadata: pack'in `metadataSchema` anahtarları, analiz + marka profilinden
 * ön-doldurulur; kullanıcı düzenler. (Uppercase brand token collision'ını önlemek
 * için metadata SADECE bu form; brand toptan merge edilmez.)
 */
export const PackPicker = ({
  suggestedSector,
  analysisFields,
  brandProfile,
  hasImage,
  busy,
  onGenerate,
  onEditBrand,
}: {
  suggestedSector?: string
  analysisFields?: Record<string, string>
  brandProfile: BrandProfile
  hasImage: boolean
  busy: boolean
  onGenerate: (instruction: string, label: string) => void
  onEditBrand: () => void
}) => {
  const { data, isLoading } = usePacks()
  const packs: PackSummary[] = useMemo(() => data?.packs ?? [], [data])

  const [packId, setPackId] = useState<string | undefined>()
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [shotId, setShotId] = useState<string | undefined>()
  const [form, setForm] = useState<Record<string, string>>({})

  // Sektöre göre pack seç (analizden). Henüz seçim yoksa eşleşeni / ilkini al.
  useEffect(() => {
    if (!packs.length) return
    setPackId((prev) => {
      if (prev && packs.some((p) => p.id === prev)) return prev
      const match = suggestedSector
        ? packs.find((p) => p.sector === suggestedSector)
        : undefined
      return match?.id ?? packs[0].id
    })
  }, [packs, suggestedSector])

  const pack = packs.find((p) => p.id === packId)
  const category = pack?.categories.find((c) => c.id === categoryId)
  const shot = category?.shots.find((s) => s.id === shotId)

  // Kategori (veya pack) değişince: shot sıfırla, formu şemadan analiz+marka ile seed'le.
  useEffect(() => {
    setShotId(undefined)
    if (!category) {
      setForm({})
      return
    }
    setForm(
      Object.fromEntries(
        category.metadataSchema.map((k) => [
          k,
          analysisFields?.[k] ?? brandProfile[k] ?? "",
        ])
      )
    )
    // analysisFields/brandProfile kasıtlı dışta: seed yalnız kategori/pack değişince.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, packId])

  const metadata = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(form).filter(([, v]) => v != null && v.trim() !== "")
      ),
    [form]
  )

  if (isLoading) {
    return (
      <div className="text-ui-fg-subtle flex items-center gap-x-2 p-4">
        <Spinner className="animate-spin" />
        <Text size="small">Paketler yükleniyor…</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Sektör / pack */}
      {packs.length > 1 && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            Sektör paketi
          </Text>
          <Row>
            {packs.map((p) => (
              <Chip
                key={p.id}
                active={p.id === packId}
                label={p.label}
                onClick={() => {
                  setPackId(p.id)
                  setCategoryId(undefined)
                }}
              />
            ))}
          </Row>
        </div>
      )}

      {/* Kategori */}
      {pack && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            Kategori
          </Text>
          <Row>
            {pack.categories.map((c) => (
              <Chip
                key={c.id}
                active={c.id === categoryId}
                label={c.label}
                onClick={() => setCategoryId(c.id)}
              />
            ))}
          </Row>
        </div>
      )}

      {/* Metadata (şemadan; analiz + marka ön-dolu) */}
      {category && category.metadataSchema.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
            <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
              Detaylar
            </Text>
            <button
              type="button"
              onClick={onEditBrand}
              className="text-ui-fg-muted hover:text-ui-fg-base text-xs"
            >
              Marka profili
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {category.metadataSchema.map((k) => (
              <div key={k} className="flex flex-col gap-y-1">
                <Text size="xsmall" className="text-ui-fg-muted">
                  {k}
                </Text>
                <Input
                  size="small"
                  value={form[k] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [k]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shot */}
      {category && (
        <div className="flex flex-col gap-y-1.5">
          <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
            Çekim tipi
          </Text>
          <Row>
            {category.shots.map((s) => (
              <Chip
                key={s.id}
                active={s.id === shotId}
                label={s.label}
                onClick={() => setShotId(s.id)}
              />
            ))}
          </Row>
        </div>
      )}

      {/* Deterministik önizleme + Üret */}
      {pack && category && shot ? (
        <ShotPreview
          key={`${pack.id}:${category.id}:${shot.id}`}
          packId={pack.id}
          categoryId={category.id}
          shot={shot}
          label={`${category.label} · ${shot.label}`}
          metadata={metadata}
          hasImage={hasImage}
          busy={busy}
          onGenerate={onGenerate}
        />
      ) : (
        <div className="border-ui-border-base text-ui-fg-subtle flex items-start gap-x-2 rounded-lg border border-dashed p-4">
          <Buildings className="text-ui-fg-muted mt-0.5 shrink-0" />
          <Text size="small">
            Bir kategori ve çekim tipi seç — deterministik talimat burada
            oluşur, sonra üret.
          </Text>
        </div>
      )}
    </div>
  )
}
