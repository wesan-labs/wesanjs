import { z } from "zod"
import type { Template } from "./types"

const slotBind = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), role: z.enum(["headline", "body", "cta", "custom"]), maxLen: z.number().optional() }),
  z.object({ kind: z.literal("color"), role: z.enum(["primary", "secondary", "accent"]) }),
  z.object({ kind: z.literal("font"), role: z.enum(["primary", "secondary"]) }),
  z.object({ kind: z.literal("logo") }),
  z.object({ kind: z.literal("image"), source: z.enum(["user-media", "ai-generate"]) }),
])

const sceneNode: z.ZodType = z.lazy(() =>
  z.object({
    type: z.enum(["Rect", "Text", "Image", "Group"]),
    id: z.string(),
    slotId: z.string().optional(),
    attrs: z.record(z.string(), z.unknown()),
    children: z.array(sceneNode).optional(),
  })
)

export const TemplateSchema = z.object({
  id: z.string(),
  kind: z.literal("image"),
  format: z.string(),
  label: z.string(),
  domainTags: z.array(z.string()).optional(),
  scene: z.object({
    width: z.number(),
    height: z.number(),
    background: z.string().optional(),
    nodes: z.array(sceneNode),
  }),
  slots: z.array(z.object({ id: z.string(), bind: slotBind })),
  thumbnail: z.string().optional(),
})

export const validateTemplate = (input: unknown): Template =>
  TemplateSchema.parse(input) as Template
