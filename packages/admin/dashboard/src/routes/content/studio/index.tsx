import { ArrowDownTray, Buildings, CheckCircleSolid, PaperPlane, Sparkles } from "@medusajs/icons"
import { Button, Container, Heading, Input, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import {
  useCreateContentProduct,
  useStudioDraft,
  type StudioDraft,
} from "../../../hooks/api/content"
import { PhotoSet } from "../components/photo-set"
import { PublishComposer } from "../../social-media/components/publish-composer"

/**
 * Outcome-akış stüdyosu (§3.1) — ürün sahibi için "gir → taslak → gözden geçir →
 * gönder". Teknik hat gizli; kullanıcı fotoğraf verir, satışa-hazır sonucu onaylar.
 * Bugünkü panelli stüdyo `/content` (Gelişmiş) olarak kalır; bu yeni varsayılan aday.
 */
export const Component = () => {
  const [photos, setPhotos] = useState<string[]>([])
  const [productName, setProductName] = useState("")
  const [draft, setDraft] = useState<StudioDraft | null>(null)
  const [description, setDescription] = useState("")
  const [caption, setCaption] = useState("")
  const [composerOpen, setComposerOpen] = useState(false)

  const draftMut = useStudioDraft()
  const productMut = useCreateContentProduct()

  const generate = () => {
    if (!photos.length) return
    draftMut.mutate(
      { images: photos, product_name: productName.trim() || undefined },
      {
        onSuccess: ({ draft }) => {
          setDraft(draft)
          setDescription(draft.description)
          setCaption(draft.caption)
        },
        onError: (e) => toast.error("Taslak üretilemedi", { description: String(e?.message ?? e) }),
      }
    )
  }

  const addToStore = () => {
    const hero = draft?.heroImage
    if (!hero) return
    productMut.mutate(
      { title: productName.trim() || "Yeni ürün", description, images: [hero, ...photos] },
      {
        onSuccess: (r) =>
          toast.success("Mağazana eklendi (taslak ürün)", {
            description: `${r.product?.title ?? productName} — mağazada düzenleyebilirsin`,
          }),
        onError: (e) => toast.error("Ürün oluşturulamadı", { description: String(e?.message ?? e) }),
      }
    )
  }

  const reset = () => {
    setDraft(null)
    setDescription("")
    setCaption("")
  }

  return (
    <Container className="max-w-3xl p-6">
      <div className="mb-5 flex items-center gap-x-2">
        <Sparkles className="text-ui-fg-interactive" />
        <Heading level="h2">Ürününü satışa hazırla</Heading>
      </div>

      {/* ── GİRDİ ── */}
      {!draft && (
        <div className="flex flex-col gap-y-5">
          <Text size="small" className="text-ui-fg-subtle">
            Ürününün fotoğraflarını yükle; temiz görsel, açıklama ve paylaşım metnini senin için
            hazırlayalım. Farklı açılardan çekersen daha iyi.
          </Text>
          <PhotoSet photos={photos} onChange={setPhotos} disabled={draftMut.isPending} />
          <Input
            placeholder="Ürün adı (opsiyonel — örn. KLT-102 Koltuk)"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            disabled={draftMut.isPending}
          />
          <Button
            onClick={generate}
            isLoading={draftMut.isPending}
            disabled={!photos.length || draftMut.isPending}
            className="w-fit"
          >
            {draftMut.isPending ? "Hazırlanıyor…" : "Satışa hazırla"}
          </Button>
          {draftMut.isPending && (
            <Text size="xsmall" className="text-ui-fg-muted">
              Temiz görsel hazırlanıyor · açıklama yazılıyor…
            </Text>
          )}
        </div>
      )}

      {/* ── GÖZDEN GEÇİR ── */}
      {draft && (
        <div className="flex flex-col gap-y-5">
          <div className="flex items-center gap-x-2">
            <CheckCircleSolid className="text-ui-tag-green-icon" />
            <Text size="small" weight="plus">
              Hazır — beğenmediğin yeri düzenle, sonra gönder
            </Text>
          </div>

          {/* Temiz görsel */}
          <div className="flex flex-col gap-y-1.5">
            <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
              Ürün görseli
            </Text>
            <img
              src={draft.heroImage}
              alt="ürün"
              className="border-ui-border-base w-full max-w-md rounded-lg border"
            />
          </div>

          {/* Açıklama */}
          <div className="flex flex-col gap-y-1.5">
            <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
              Mağaza açıklaması
            </Text>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {/* Caption */}
          <div className="flex flex-col gap-y-1.5">
            <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
              Sosyal medya metni
            </Text>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
          </div>

          {/* Gönder */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button onClick={addToStore} isLoading={productMut.isPending}>
              <Buildings />
              Mağazana ekle
            </Button>
            <Button variant="secondary" onClick={() => setComposerOpen(true)}>
              <PaperPlane />
              Sosyalde paylaş
            </Button>
            <a href={draft.heroImage} download="urun.png">
              <Button variant="secondary">
                <ArrowDownTray />
                Görseli indir
              </Button>
            </a>
            <Button variant="transparent" onClick={reset}>
              Yeni ürün
            </Button>
          </div>
        </div>
      )}

      <PublishComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initialContent={caption}
        initialImage={draft?.heroImage}
      />
    </Container>
  )
}
