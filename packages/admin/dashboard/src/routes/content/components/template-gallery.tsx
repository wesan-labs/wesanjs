import { Badge, Button, Text } from "@medusajs/ui"
import { useState } from "react"
import { SceneRenderer, type SceneJSON } from "./scene-renderer"
import { ContentTemplate, useTemplates } from "../../../hooks/api/content"

const PREVIEW_W = 200

/**
 * Markaya-önerili template ızgarası. Kart önizlemesi = template'in ham sahnesini
 * SceneRenderer ile küçük ölçekte bas (ayrı thumbnail asset'i yok). `domain`
 * verilirse öneri sırası (recommendTemplates). Seçince onPick → Faz 2 fill akışı.
 */
export const TemplateGallery = ({
  domain,
  onPick,
}: {
  domain?: string
  onPick: (t: ContentTemplate) => void
}) => {
  const { data, isLoading } = useTemplates(domain)
  const templates = data?.templates ?? []
  const formats = Array.from(new Set(templates.map((t) => t.format)))
  const [format, setFormat] = useState<string | null>(null)
  const shown = format ? templates.filter((t) => t.format === format) : templates

  if (isLoading)
    return <Text size="small" className="text-ui-fg-subtle">Yükleniyor…</Text>
  if (!templates.length)
    return <Text size="small" className="text-ui-fg-subtle">Template bulunamadı.</Text>

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="small" variant={!format ? "primary" : "secondary"} onClick={() => setFormat(null)}>
          Tümü
        </Button>
        {formats.map((f) => (
          <Button
            key={f}
            size="small"
            variant={format === f ? "primary" : "secondary"}
            onClick={() => setFormat(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {shown.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="group flex flex-col gap-y-2 rounded-lg border border-ui-border-base p-2 text-left transition-shadow hover:shadow-elevation-card-hover"
          >
            <div className="flex items-center justify-center overflow-hidden rounded bg-ui-bg-subtle">
              {/* ham sahne (doldurulmamış) önizleme — SceneJSON ile aynı runtime şekli */}
              <SceneRenderer scene={t.scene as unknown as SceneJSON} scale={PREVIEW_W / t.scene.width} />
            </div>
            <div className="flex items-center justify-between gap-x-2">
              <Text size="small" weight="plus" className="truncate">{t.label}</Text>
              <Badge size="2xsmall">{t.format}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
