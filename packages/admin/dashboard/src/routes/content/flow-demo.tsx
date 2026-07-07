import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { TemplateGallery } from "./components/template-gallery"
import { TemplateEditor, type EditScene } from "./components/template-editor"
import { ContentTemplate, useFillTemplate } from "../../hooks/api/content"
import { brandProfileToIdentity, loadBrandProfile } from "./components/brand-profile"

/**
 * Uçtan-uca kredisiz dilim (Faz 1→2→3→4): galeri → template seç → markayla
 * doldur (deterministik color/copy) → editörde düzenle → PNG export. LLM kopya +
 * AI görsel backend'e sonra takılır; bu akış onlarsız da tam çalışır.
 */
export const Component = () => {
  const brand = brandProfileToIdentity(loadBrandProfile())
  const fill = useFillTemplate()
  const [scene, setScene] = useState<EditScene | null>(null)
  const [picked, setPicked] = useState<ContentTemplate | null>(null)

  const onPick = (t: ContentTemplate) => {
    setPicked(t)
    fill.mutate(
      { templateId: t.id, brand },
      {
        // fill response scene = resolved SceneJSON — EditScene ile aynı runtime şekli
        onSuccess: (res) => setScene(res.scene as unknown as EditScene),
        onError: (e) => toast.error("Doldurma başarısız", { description: String(e?.message ?? e) }),
      }
    )
  }

  const reset = () => {
    setScene(null)
    setPicked(null)
  }

  const handleSave = (dataUrl: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${picked?.id ?? "content"}.png`
    a.click()
    toast.success("PNG dışa aktarıldı")
  }

  return (
    <Container className="p-6">
      <div className="mb-4 flex items-start justify-between gap-x-4">
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">Uçtan-uca dilim (Faz 1→2→3→4)</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Galeri → seç → markayla doldur → düzenle → export. Marka: <b>{brand.name}</b> · {brand.domain}
          </Text>
        </div>
        {scene && (
          <Button size="small" variant="secondary" onClick={reset}>
            ← Galeriye dön
          </Button>
        )}
      </div>

      {!scene && !fill.isPending && <TemplateGallery domain={brand.domain} onPick={onPick} />}
      {fill.isPending && <Text size="small" className="text-ui-fg-subtle">Markayla dolduruluyor…</Text>}
      {scene && (
        <TemplateEditor scene={scene} scale={scene.width > 1100 ? 0.5 : 0.44} onSave={handleSave} />
      )}
    </Container>
  )
}
