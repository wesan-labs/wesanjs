import { TemplateError, type FillData, type SceneJSON, type SceneNode, type Slot, type Template } from "./types"

// slot bind türü → hangi attr'a yazılır
const attrFor: Record<string, string> = {
  text: "text", color: "fill", font: "fontFamily", image: "src", logo: "src",
}

const applyNode = (node: SceneNode, fill: FillData, slotIndex: Map<string, Slot>): SceneNode => {
  let attrs = node.attrs
  if (node.slotId) {
    const slot = slotIndex.get(node.slotId)
    if (!slot) throw new TemplateError(`Node ${node.id} bilinmeyen slot ${node.slotId}`)
    const v = fill[node.slotId]
    if (!v) throw new TemplateError(`Slot ${node.slotId} için fill yok`)
    const attr = attrFor[v.kind]
    attrs = { ...attrs, [attr]: v.value }
  }
  return {
    ...node,
    attrs,
    children: node.children?.map((c) => applyNode(c, fill, slotIndex)),
  }
}

/** Template + fill → çözülmüş sahne. Deterministik (saf). O(node sayısı). */
export const resolveScene = (template: Template, fill: FillData): SceneJSON => {
  const slotIndex = new Map(template.slots.map((s) => [s.id, s]))
  return {
    ...template.scene,
    nodes: template.scene.nodes.map((n) => applyNode(n, fill, slotIndex)),
  }
}
