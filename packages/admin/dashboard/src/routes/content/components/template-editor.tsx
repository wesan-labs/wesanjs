import { useEffect, useRef, useState } from "react"
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Transformer } from "react-konva"
import type Konva from "konva"
import { Button, Input, Select, Text as UIText } from "@medusajs/ui"

/** Editör düzenlenebilir sahne — SceneRenderer'ın mutable karşılığı (Faz 3). */
export interface EditNode {
  type: "Rect" | "Text" | "Image" | "Group"
  id: string
  attrs: Record<string, any>
  children?: EditNode[]
}
export interface EditScene { width: number; height: number; background?: string; nodes: EditNode[] }

const FONTS = ["Georgia", "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana"]

const useImg = (src?: string) => {
  const [img, setImg] = useState<HTMLImageElement>()
  useEffect(() => {
    if (!src) return
    const i = new window.Image()
    i.crossOrigin = "anonymous"
    i.src = src
    i.onload = () => setImg(i)
  }, [src])
  return img
}

type NodeProps = {
  node: EditNode
  onSelect: (id: string) => void
  onChange: (id: string, patch: Record<string, any>) => void
}

const EditableNode = ({ node, onSelect, onChange }: NodeProps) => {
  const img = useImg(node.type === "Image" ? node.attrs.src : undefined)

  const common = {
    id: node.id,
    ...node.attrs,
    draggable: true,
    onClick: () => onSelect(node.id),
    onTap: () => onSelect(node.id),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
      onChange(node.id, { x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const n = e.target
      const scaleX = n.scaleX()
      const scaleY = n.scaleY()
      n.scaleX(1)
      n.scaleY(1)
      onChange(node.id, {
        x: n.x(),
        y: n.y(),
        rotation: n.rotation(),
        width: Math.max(16, (node.attrs.width ?? n.width()) * scaleX),
        height: Math.max(16, (node.attrs.height ?? n.height()) * scaleY),
      })
    },
  }

  if (node.type === "Rect") return <Rect {...common} />
  if (node.type === "Text") return <Text {...common} />
  if (node.type === "Image") return img ? <KonvaImage {...common} image={img} /> : null
  if (node.type === "Group")
    return (
      <Group {...common}>
        {node.children?.map((c) => (
          <EditableNode key={c.id} node={c} onSelect={onSelect} onChange={onChange} />
        ))}
      </Group>
    )
  return null
}

/** Bir attr için etiketli kontrol — panelde tek satır. */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex items-center justify-between gap-x-2">
    <UIText size="small" className="text-ui-fg-subtle">{label}</UIText>
    {children}
  </label>
)

export interface TemplateEditorProps {
  scene: EditScene
  scale?: number
  onSave?: (dataUrl: string) => void
}

/** react-konva editör: seç → taşı/boyutlandır (Transformer), metin/renk/font düzenle, PNG export. */
export const TemplateEditor = ({ scene: initial, scale = 1, onSave }: TemplateEditorProps) => {
  const [scene, setScene] = useState<EditScene>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // seçim değişince Transformer'ı ilgili node'a bağla
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const target = selectedId ? stage.findOne("#" + selectedId) : null
    tr.nodes(target ? [target] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, scene])

  const updateAttrs = (id: string, patch: Record<string, any>) =>
    setScene((s) => ({
      ...s,
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, attrs: { ...n.attrs, ...patch } } : n)),
    }))

  const selected = scene.nodes.find((n) => n.id === selectedId) ?? null

  const handleExport = () => {
    // transformer'ı senkron gizle → çiz → yakala → geri getir (rAF yarışı yok)
    const tr = trRef.current
    const prev = tr?.nodes() ?? []
    tr?.nodes([])
    tr?.getLayer()?.batchDraw()
    const url = stageRef.current?.toDataURL({ pixelRatio: 2 })
    tr?.nodes(prev)
    tr?.getLayer()?.batchDraw()
    if (url) onSave?.(url)
  }

  const deselectOnEmpty = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null)
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="inline-block rounded-lg border border-ui-border-base shadow-elevation-card-rest">
        <Stage
          ref={stageRef}
          width={scene.width * scale}
          height={scene.height * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={deselectOnEmpty}
          onTouchStart={deselectOnEmpty}
        >
          <Layer>
            {scene.background && (
              <Rect x={0} y={0} width={scene.width} height={scene.height} fill={scene.background} listening={false} />
            )}
            {scene.nodes.map((n) => (
              <EditableNode key={n.id} node={n} onSelect={setSelectedId} onChange={updateAttrs} />
            ))}
            <Transformer
              ref={trRef}
              rotateEnabled
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 16 || newBox.height < 16 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
      </div>

      <div className="flex w-full flex-col gap-y-3 lg:w-72">
        <UIText size="small" weight="plus">Düzenle</UIText>
        {!selected && (
          <UIText size="small" className="text-ui-fg-subtle">
            Bir öğe seç (tıkla) — sonra taşı, boyutlandır veya aşağıdan düzenle.
          </UIText>
        )}

        {selected && (
          <div className="flex flex-col gap-y-3">
            {selected.type === "Text" && (
              <Field label="Metin">
                <Input
                  size="small"
                  value={String(selected.attrs.text ?? "")}
                  onChange={(e) => updateAttrs(selected.id, { text: e.target.value })}
                />
              </Field>
            )}

            {selected.type === "Text" && (
              <Field label="Punto">
                <Input
                  type="number"
                  size="small"
                  className="w-24"
                  value={String(selected.attrs.fontSize ?? 40)}
                  onChange={(e) => updateAttrs(selected.id, { fontSize: Number(e.target.value) || 1 })}
                />
              </Field>
            )}

            {selected.type === "Text" && (
              <Field label="Font">
                <Select
                  size="small"
                  value={String(selected.attrs.fontFamily ?? FONTS[0])}
                  onValueChange={(v) => updateAttrs(selected.id, { fontFamily: v })}
                >
                  <Select.Trigger className="w-40"><Select.Value /></Select.Trigger>
                  <Select.Content>
                    {FONTS.map((f) => (
                      <Select.Item key={f} value={f}>{f}</Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
            )}

            <Field label="Renk">
              <input
                type="color"
                value={String(selected.attrs.fill ?? "#000000")}
                onChange={(e) => updateAttrs(selected.id, { fill: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-ui-border-base bg-transparent"
              />
            </Field>

            <Button size="small" variant="secondary" onClick={() => setSelectedId(null)}>
              Seçimi bırak
            </Button>
          </div>
        )}

        <div className="mt-2 border-t border-ui-border-base pt-3">
          <Button size="small" onClick={handleExport} className="w-full">
            PNG dışa aktar
          </Button>
        </div>
      </div>
    </div>
  )
}
