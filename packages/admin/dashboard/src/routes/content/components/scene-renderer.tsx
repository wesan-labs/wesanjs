import { useEffect, useState } from "react"
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from "react-konva"

interface SceneNode {
  type: "Rect" | "Text" | "Image" | "Group"
  id: string
  attrs: Record<string, any>
  children?: SceneNode[]
}
export interface SceneJSON { width: number; height: number; background?: string; nodes: SceneNode[] }

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

const NodeView = ({ node }: { node: SceneNode }) => {
  const img = useImg(node.type === "Image" ? node.attrs.src : undefined)
  if (node.type === "Rect") return <Rect {...node.attrs} />
  if (node.type === "Text") return <Text {...node.attrs} />
  if (node.type === "Image") return img ? <KonvaImage image={img} {...node.attrs} /> : null
  if (node.type === "Group")
    return <Group {...node.attrs}>{node.children?.map((c) => <NodeView key={c.id} node={c} />)}</Group>
  return null
}

/** SceneJSON → react-konva Stage. `scale` ile konteynere sığdır. */
export const SceneRenderer = ({ scene, scale = 1 }: { scene: SceneJSON; scale?: number }) => (
  <Stage width={scene.width * scale} height={scene.height * scale} scaleX={scale} scaleY={scale}>
    <Layer>
      {scene.background && <Rect x={0} y={0} width={scene.width} height={scene.height} fill={scene.background} />}
      {scene.nodes.map((n) => <NodeView key={n.id} node={n} />)}
    </Layer>
  </Stage>
)
