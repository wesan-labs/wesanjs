import { Spinner, Sparkles } from "@medusajs/icons"
import { Button, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import {
  ContentBrief,
  ContentTone,
  ContentVariant,
  useGenerateContent,
} from "../../../hooks/api/content"
import {
  ALL_FORMATS,
  ALL_PLATFORMS,
  buildTargets,
} from "./content-targets"
import { MultiSelect } from "./multi-select"
import { PlatformGlyph } from "./prompt-meta"

type Source = { data: string; mime: string }
type OnBrief = (b: {
  language: string
  brief: ContentBrief
  variants: ContentVariant[]
}) => void

const TONES: { value: ContentTone; label: string }[] = [
  { value: "casual", label: "Samimi" },
  { value: "professional", label: "Profesyonel" },
  { value: "bold", label: "İddialı" },
  { value: "playful", label: "Eğlenceli" },
]

const PLATFORM_OPTIONS = ALL_PLATFORMS.map((p) => ({
  ...p,
  glyph: (
    <PlatformGlyph platform={p.value} className="text-ui-fg-subtle size-3.5 shrink-0" />
  ),
}))

const toggleIn = (set: Set<string>, value: string): Set<string> => {
  const next = new Set(set)
  next.has(value) ? next.delete(value) : next.add(value)
  return next
}

/** Quick caption/script from the current image; output language is global. */
export const TextPanel = ({
  source,
  languages,
  onBrief,
  disabled,
}: {
  source?: Source
  languages: string[]
  onBrief: OnBrief
  disabled?: boolean
}) => {
  // Two separate multi-selects; targets = valid cross-product.
  const [platforms, setPlatforms] = useState<Set<string>>(
    new Set(["instagram", "tiktok"])
  )
  const [formats, setFormats] = useState<Set<string>>(
    new Set(["reels", "video"])
  )
  const [tone, setTone] = useState<ContentTone>("casual")
  const [goal, setGoal] = useState("")
  const { mutateAsync, isPending } = useGenerateContent()

  const targets = buildTargets([...platforms], [...formats])

  const handleGenerate = async () => {
    if (targets.length === 0 || isPending) {
      return
    }
    if (!source) {
      toast.error("Önce bir görsel yükle")
      return
    }
    try {
      // One generation per selected language (sequential).
      for (const language of languages) {
        const { generation } = await mutateAsync({
          images: [{ data: source.data, mime: source.mime }],
          targets,
          tone,
          language,
          goal: goal.trim() || undefined,
          media_type: "image",
        })
        onBrief({ language, brief: generation.brief, variants: generation.variants })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İçerik üretilemedi")
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <Sparkles className="text-ui-fg-interactive" />
        <Text weight="plus">Hızlı caption / script</Text>
      </div>

      <div className="flex flex-col gap-y-2">
        <Text size="small" weight="plus">
          Platform + tür
        </Text>
        <div className="flex gap-2">
          <div className="flex-1">
            <MultiSelect
              placeholder="Platformlar"
              options={PLATFORM_OPTIONS}
              selected={platforms}
              onToggle={(v) => setPlatforms((s) => toggleIn(s, v))}
            />
          </div>
          <div className="flex-1">
            <MultiSelect
              placeholder="Türler"
              options={ALL_FORMATS}
              selected={formats}
              onToggle={(v) => setFormats((s) => toggleIn(s, v))}
            />
          </div>
        </div>
        {targets.length > 0 ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            Üretilecek: {targets.map((t) => t.label).join(" · ")}
          </Text>
        ) : (
          <Text size="xsmall" className="text-ui-fg-muted">
            En az bir platform ve tür seç (geçerli eşleşme yok).
          </Text>
        )}
      </div>

      <div className="flex flex-col gap-y-2">
        <Text size="small" weight="plus">
          Ton
        </Text>
        <Select value={tone} onValueChange={(v) => setTone(v as ContentTone)}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {TONES.map((t) => (
              <Select.Item key={t.value} value={t.value}>
                {t.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div className="flex flex-col gap-y-2">
        <Text size="small" weight="plus">
          Amaç <span className="text-ui-fg-muted">(opsiyonel)</span>
        </Text>
        <Textarea
          placeholder="Örn: yeni ürün lansmanı, %20 indirim"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={2}
        />
      </div>

      <Button
        variant="primary"
        onClick={handleGenerate}
        disabled={targets.length === 0 || isPending || disabled}
        isLoading={isPending}
        className="transition-transform duration-100 ease-out active:scale-[0.98]"
      >
        <Sparkles />
        İçerik üret{" "}
        {languages.length > 1 ? `(${languages.length} dil)` : `(${languages[0]})`}
      </Button>
      {isPending && (
        <div className="text-ui-fg-subtle flex items-center gap-x-2">
          <Spinner className="animate-spin" />
          <Text size="small">Görsel analiz ediliyor, metin yazılıyor…</Text>
        </div>
      )}
    </div>
  )
}
