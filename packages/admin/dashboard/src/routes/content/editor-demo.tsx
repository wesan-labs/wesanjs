import { Container, Heading, Text, toast } from "@medusajs/ui"
import { TemplateEditor, type EditScene } from "./components/template-editor"

/**
 * Faz 3 görsel doğrulama demosu — TemplateEditor: seç, taşı/boyutlandır, metin/
 * renk/font düzenle, PNG export. Sahne Faz 1 demo'suyla aynı (kahve markası).
 * Kredisiz: fill/AI yok, sadece editör mekaniği. Faz 5'te studio'ya gömülür.
 */
const demoScene: EditScene = {
  width: 1080,
  height: 1080,
  background: "#f4ece2",
  nodes: [
    { type: "Rect", id: "band", attrs: { x: 0, y: 0, width: 1080, height: 320, fill: "#3b2a20" } },
    { type: "Text", id: "brand", attrs: { x: 64, y: 120, text: "TERRA KAHVE", fill: "#f4ece2", fontSize: 72, fontStyle: "bold", fontFamily: "Georgia" } },
    { type: "Text", id: "headline", attrs: { x: 64, y: 460, width: 952, text: "Sabahın ilk ritüeli", fill: "#3b2a20", fontSize: 96, fontStyle: "bold", fontFamily: "Georgia" } },
    { type: "Text", id: "body", attrs: { x: 64, y: 640, width: 900, text: "Küçük partiler halinde kavrulan tek köken çekirdekler. Her fincanda kaynağını tanı.", fill: "#5c4a3a", fontSize: 44, lineHeight: 1.4, fontFamily: "Georgia" } },
    { type: "Rect", id: "cta-bg", attrs: { x: 64, y: 900, width: 420, height: 96, fill: "#c2703d", cornerRadius: 12 } },
    { type: "Text", id: "cta", attrs: { x: 64, y: 930, width: 420, align: "center", text: "Bugün keşfet", fill: "#ffffff", fontSize: 40, fontStyle: "bold", fontFamily: "Georgia" } },
  ],
}

export const Component = () => {
  const handleSave = (dataUrl: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "terra-kahve.png"
    a.click()
    toast.success("PNG dışa aktarıldı", { description: "terra-kahve.png indirildi" })
  }

  return (
    <Container className="p-6">
      <div className="mb-4 flex flex-col gap-y-1">
        <Heading level="h2">Editör demosu (Faz 3)</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Bir öğeye tıkla → köşelerden boyutlandır / sürükle. Sağ panelden metin, punto, font, renk
          değiştir. "PNG dışa aktar" ile 2x çözünürlükte indir.
        </Text>
      </div>
      <TemplateEditor scene={demoScene} scale={0.44} onSave={handleSave} />
    </Container>
  )
}
