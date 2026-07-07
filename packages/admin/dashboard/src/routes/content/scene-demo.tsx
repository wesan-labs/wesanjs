import { Container, Heading, Text } from "@medusajs/ui"
import { SceneRenderer, type SceneJSON } from "./components/scene-renderer"

/**
 * Faz 1 görsel doğrulama demosu — SceneRenderer bir resolved sahneyi ekrana
 * basıyor mu? Sahne, resolveScene(template, brandFill) çıktısının elle kurulmuş
 * örneği (kahve kavurucusu markası). Kredisiz: görsel-slot yok, sadece
 * token/kopya çözülmüş gibi. Faz 5 entegrasyonunda bu route kalkar.
 */
const demoScene: SceneJSON = {
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
  const scale = 0.44 // 1080 → ~475px

  return (
    <Container className="p-6">
      <div className="mb-4 flex flex-col gap-y-1">
        <Heading level="h2">Sahne render demosu (Faz 1)</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          SceneRenderer, resolveScene çıktısı biçiminde bir sahneyi react-konva ile basıyor. Metin,
          renk, dikdörtgen, arka plan doğru mu?
        </Text>
      </div>
      <div className="inline-block rounded-lg border border-ui-border-base shadow-elevation-card-rest">
        <SceneRenderer scene={demoScene} scale={scale} />
      </div>
    </Container>
  )
}
