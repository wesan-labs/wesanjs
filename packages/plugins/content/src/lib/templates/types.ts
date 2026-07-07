/** Template = tipli slot'lu react-konva sahnesi (mimari v3 §2). */

export type SlotBind =
  | { kind: "text"; role: "headline" | "body" | "cta" | "custom"; maxLen?: number }
  | { kind: "color"; role: "primary" | "secondary" | "accent" }
  | { kind: "font"; role: "primary" | "secondary" }
  | { kind: "logo" }
  | { kind: "image"; source: "user-media" | "ai-generate" }

export interface Slot {
  id: string
  bind: SlotBind
}

/** react-konva node — sahne ağacı. `slotId` verilirse fill ile doldurulur. */
export interface SceneNode {
  type: "Rect" | "Text" | "Image" | "Group"
  id: string
  slotId?: string
  attrs: Record<string, unknown> // x,y,width,height,fill,text,fontFamily,src...
  children?: SceneNode[]
}

export interface SceneJSON {
  width: number
  height: number
  background?: string
  nodes: SceneNode[]
}

export interface Template {
  id: string
  kind: "image" // Faz 6'da "video"
  format: string // "ig-post-1x1" | "ig-story-9x16" | "og-16x9"...
  label: string
  domainTags?: string[]
  scene: SceneJSON
  slots: Slot[]
  thumbnail?: string
}

/** Slot id → uygulanacak değer (fill.ts üretir). */
export interface FillData {
  [slotId: string]:
    | { kind: "text"; value: string }
    | { kind: "color"; value: string }
    | { kind: "font"; value: string }
    | { kind: "image"; value: string } // data URL veya http URL
}

/** resolve hatası — çözülemeyen slot / geçersiz sahne. */
export class TemplateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TemplateError"
  }
}
