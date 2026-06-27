import {
  GridLayout,
  MagnifyingGlass,
  Photo,
  Sparkles,
  Spinner,
} from "@medusajs/icons"
import { Button, Input, Select, Text, Textarea, clx, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import {
  PromptListItem,
  PromptVariableMeta,
  useExamplePrompt,
  usePrompts,
  useRunPrompt,
} from "../../../hooks/api/content"
import { BRAND_VARS, BrandProfile, profileValues } from "./brand-profile"
import { StepStrip } from "./panel-chrome"
import { PromptCard } from "./prompt-card"
import {
  ASPECTS,
  AspectGlyph,
  ToneIcon,
  aspectDescriptor,
  conceptDescriptor,
  conceptsForSector,
  promptSnippet,
  sectorIcon,
  typeMeta,
} from "./prompt-meta"

const BRAND_SET = new Set<string>(BRAND_VARS)

type OnApplyImage = (
  promptId: string,
  variables: Record<string, string>,
  label: string
) => Promise<void>
type OnText = (r: { title: string; text: string; language: string }) => void

const ALL = "__all__"

const VariableField = ({
  name,
  meta,
  value,
  onChange,
}: {
  name: string
  meta?: PromptVariableMeta
  value: string
  onChange: (v: string) => void
}) => {
  const options = meta?.values ?? meta?.enum_example
  const longText = name === "SOURCE_CONTENT"
  return (
    <div className="flex flex-col gap-y-1.5">
      <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
        {name}
      </Text>
      {options?.length ? (
        <Select value={value || undefined} onValueChange={onChange}>
          <Select.Trigger>
            <Select.Value placeholder={meta?.example ?? "Seç"} />
          </Select.Trigger>
          <Select.Content>
            {options.map((o) => (
              <Select.Item key={o} value={o}>
                {o}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      ) : longText ? (
        <Textarea
          rows={2}
          placeholder={meta?.example}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          placeholder={meta?.example}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

/** A single icon-led filter chip (the primary axis: content-type or tone). */
const FilterChip = ({
  active,
  icon,
  label,
  title,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  title?: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={clx(
      "flex shrink-0 snap-start items-center gap-x-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-100",
      active
        ? "border-ui-border-interactive bg-ui-bg-base text-ui-fg-base shadow-borders-base"
        : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base"
    )}
  >
    <span className={clx("flex", active ? "text-ui-fg-interactive" : "text-ui-fg-muted")}>
      {icon}
    </span>
    {label}
  </button>
)

/**
 * Reusable prompt library browser, scoped by output kind. `language` is injected
 * into the prompt's {{LANGUAGE}} variable automatically (so it isn't shown as a
 * field). Image prompts run through onApplyImage; text prompts through onText.
 */
export const PromptLibrarySection = ({
  kind,
  languages,
  onApplyImage,
  onText,
  busy,
  hasImage = true,
  brandProfile = {},
  onEditBrand,
  wide = false,
  suggestedAspect,
  suggestedSector,
  analysisFields = {},
}: {
  kind: "image" | "text"
  languages: string[]
  onApplyImage: OnApplyImage
  onText: OnText
  busy: boolean
  hasImage?: boolean
  brandProfile?: BrandProfile
  onEditBrand?: () => void
  /** full-width bottom dock: cards span the row, the fill form goes 2-column */
  wide?: boolean
  /** aspect preset detected from the uploaded source → seeds Format */
  suggestedAspect?: string
  /** sector detected by image analysis → seeds the sector axis */
  suggestedSector?: string
  /** brand-variable hints from image analysis → auto-fill prompts */
  analysisFields?: Record<string, string>
}) => {
  const [contentType, setContentType] = useState(
    kind === "image" ? "image-prompt" : "caption"
  )
  const [filters, setFilters] = useState({
    platform: ALL,
    funnel_stage: ALL,
    tone: ALL,
    q: "",
  })
  // Sector is the PRIMARY axis for visual prompts (image kind). Default lands on
  // Can's own vertical; text prompts are sector-neutral so they ignore it.
  const [sector, setSector] = useState<string>(
    kind === "image" ? "mobile-game" : ALL
  )
  // Curated GENERATION settings (image only): selectable, not typed.
  const [aspect, setAspect] = useState<string>("4:5")
  const [concept, setConcept] = useState<string>("auto")

  // Source-aware: when a new media is uploaded, seed Format from its aspect.
  useEffect(() => {
    if (suggestedAspect) {
      setAspect(suggestedAspect)
    }
  }, [suggestedAspect])

  // Analysis-aware: detected sector seeds the sector axis (resets concept).
  useEffect(() => {
    if (suggestedSector && kind === "image") {
      setSector(suggestedSector)
      setConcept("auto")
    }
  }, [suggestedSector, kind])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vars, setVars] = useState<Record<string, string>>({})

  /** System-level style controls injected into every visual generation. */
  const styleVars = useMemo<Record<string, string>>(() => {
    if (kind !== "image") {
      return {}
    }
    const out: Record<string, string> = { ASPECT: aspectDescriptor(aspect) }
    const c = conceptDescriptor(sector, concept)
    if (c) {
      out.CONCEPT = c
    }
    return out
  }, [kind, aspect, concept, sector])

  const query = useMemo(
    () => ({
      content_type: contentType,
      platform: filters.platform === ALL ? undefined : filters.platform,
      funnel_stage:
        filters.funnel_stage === ALL ? undefined : filters.funnel_stage,
      tone: filters.tone === ALL ? undefined : filters.tone,
      sector: sector === ALL ? undefined : sector,
      q: filters.q.trim() || undefined,
    }),
    [filters, contentType, sector]
  )

  const { data, isLoading } = usePrompts(query)
  const runText = useRunPrompt()
  const exampleMut = useExamplePrompt()
  const isPending = runText.isPending || busy

  const meta = data?.meta
  // With an uploaded image, surface "transform" prompts (use your screen) first.
  const prompts = useMemo(() => {
    const list = data?.prompts ?? []
    if (kind === "image" && hasImage) {
      return [...list].sort(
        (a, b) =>
          (a.mode === "transform" ? 0 : 1) - (b.mode === "transform" ? 0 : 1)
      )
    }
    return list
  }, [data, kind, hasImage])
  const selected = prompts.find((p) => p.id === selectedId)
  const textTypes = (meta?.content_types ?? []).filter(
    (t) => t !== "image-prompt"
  )

  const step = selected ? (isPending ? 3 : 2) : 1
  const imageBlocked = kind === "image" && !hasImage

  // Live preview of the actual prompt: {{VARS}} replaced by filled values
  // (LANGUAGE auto-filled), unfilled ones shown as [VAR] placeholders.
  const mergedVars = { ...analysisFields, ...profileValues(brandProfile), ...vars }
  const promptPreview = selected
    ? selected.template.replace(
        /\{\{(\w+)\}\}/g,
        (_, k: string) =>
          (k === "LANGUAGE" ? languages[0] : mergedVars[k]?.trim()) || `[${k}]`
      )
    : ""

  const brandUsed = selected
    ? selected.variables.filter((n) => BRAND_SET.has(n))
    : []

  const setFilter = (key: keyof typeof filters) => (v: string) =>
    setFilters((prev) => ({ ...prev, [key]: v }))

  const selectPrompt = (p: PromptListItem) => {
    setSelectedId(p.id)
    setVars({})
    exampleMut.reset()
  }

  const handleExample = () => {
    if (!selected || exampleMut.isPending) {
      return
    }
    exampleMut.mutate({
      id: selected.id,
      variables: {
        ...analysisFields,
        ...profileValues(brandProfile),
        ...vars,
        ...styleVars,
        LANGUAGE: languages[0],
      },
    })
  }

  const handleRun = async () => {
    if (!selected || isPending) {
      return
    }
    const profile = { ...analysisFields, ...profileValues(brandProfile) }
    try {
      if (kind === "image") {
        await onApplyImage(
          selected.id,
          { ...profile, ...vars, ...styleVars, LANGUAGE: languages[0] },
          selected.title
        )
      } else {
        // One run per selected language (sequential).
        for (const language of languages) {
          const r = await runText.mutateAsync({
            id: selected.id,
            variables: { ...profile, ...vars, LANGUAGE: language },
          })
          onText({ title: r.title, text: r.text, language })
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Üretilemedi")
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      {/* Satır 1 — arama · sektör chip'leri · platform (genişliği doldurur) */}
      <div className={clx("flex gap-2", wide ? "flex-row items-center" : "flex-col gap-y-2")}>
        <div className={clx("relative", wide ? "w-72 shrink-0" : "w-full")}>
          <MagnifyingGlass className="text-ui-fg-muted pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            size="small"
            className="pl-8"
            placeholder="Ara: başlık, hedef…"
            value={filters.q}
            onChange={(e) => setFilter("q")(e.target.value)}
          />
        </div>
        {meta && (
          <div
            className={clx(
              "flex min-w-0 gap-2",
              wide ? "flex-1 items-center" : "flex-col gap-y-2"
            )}
          >
            {/* Birincil eksen — metin: içerik türü · görsel: SEKTÖR */}
            <div
              className={clx(
                "-mx-0.5 flex snap-x gap-1.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                wide && "min-w-0 flex-1"
              )}
            >
              {kind === "text"
                ? textTypes.map((t) => {
                    const { Icon, label } = typeMeta(t)
                    return (
                      <FilterChip
                        key={t}
                        active={contentType === t}
                        icon={<Icon />}
                        label={label}
                        onClick={() => setContentType(t)}
                      />
                    )
                  })
                : [
                    <FilterChip
                      key={ALL}
                      active={sector === ALL}
                      icon={<GridLayout />}
                      label="Tümü"
                      onClick={() => {
                        setSector(ALL)
                        setConcept("auto")
                      }}
                    />,
                    ...(meta.sectors ?? []).map((s) => {
                      const Icon = sectorIcon(s.id)
                      return (
                        <FilterChip
                          key={s.id}
                          active={sector === s.id}
                          icon={<Icon />}
                          label={s.label}
                          onClick={() => {
                            setSector(s.id)
                            setConcept("auto")
                          }}
                        />
                      )
                    }),
                  ]}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <StepStrip step={step} labels={["Seç", "Doldur", "Üret"]} />
        <Text size="xsmall" className="text-ui-fg-muted">
          {data?.count ?? 0} prompt
        </Text>
      </div>

      {/* Yatay kart şeridi — kartta gerçek prompt'tan bir parça görünür */}
      <div className="-mx-0.5 flex snap-x gap-2.5 overflow-x-auto px-0.5 pb-2 [scrollbar-width:thin]">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-ui-bg-subtle h-[150px] w-[208px] shrink-0 animate-pulse rounded-xl"
            />
          ))
        ) : prompts.length === 0 ? (
          <div className="border-ui-border-base text-ui-fg-muted flex h-[120px] w-full items-center justify-center rounded-xl border border-dashed">
            <Text size="small">Eşleşen prompt yok — aramayı değiştir.</Text>
          </div>
        ) : (
          prompts.map((p, i) => (
            <PromptCard
              key={p.id}
              item={p}
              index={i}
              selected={p.id === selectedId}
              preview={promptSnippet(p.template, meta?.variables)}
              onClick={() => selectPrompt(p)}
            />
          ))
        )}
      </div>

      {selected && (
        <div
          className={clx(
            "animate-in fade-in-0 slide-in-from-top-2 border-t pt-4 duration-200 ease-out motion-reduce:animate-none",
            wide ? "grid gap-x-8 gap-y-4 lg:grid-cols-2" : "flex flex-col gap-y-3"
          )}
        >
          {/* SOL: 2·Doldur — başlık, hedef, marka, değişkenler */}
          <div className="flex flex-col gap-y-3">
            <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
              2 · Doldur
            </Text>
            <div className="flex flex-col gap-y-0.5">
              <Text size="small" weight="plus">
                {selected.title}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {selected.goal}
              </Text>
            </div>

            {/* Üretim ayarları — gezme değil, üretim adımında: Format + Konsept */}
            {kind === "image" && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={aspect} onValueChange={setAspect} size="small">
                    <Select.Trigger className="w-full">
                      <span className="flex items-center gap-x-2 truncate">
                        <AspectGlyph
                          ratio={aspect}
                          className="text-ui-fg-interactive shrink-0"
                        />
                        {ASPECTS.find((a) => a.id === aspect)?.label}
                      </span>
                    </Select.Trigger>
                    <Select.Content>
                      {ASPECTS.map((a) => (
                        <Select.Item key={a.id} value={a.id}>
                          <span className="flex items-center gap-x-2">
                            <AspectGlyph ratio={a.id} className="text-ui-fg-muted" />
                            {a.label}
                          </span>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={concept} onValueChange={setConcept} size="small">
                    <Select.Trigger className="w-full">
                      <span className="flex items-center gap-x-2 truncate">
                        <ToneIcon className="text-ui-fg-interactive shrink-0" />
                        {conceptsForSector(sector).find((c) => c.id === concept)?.label}
                      </span>
                    </Select.Trigger>
                    <Select.Content>
                      {conceptsForSector(sector).map((c) => (
                        <Select.Item key={c.id} value={c.id}>
                          {c.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              </div>
            )}

            {brandUsed.length > 0 && (
              <div className="bg-ui-bg-subtle border-ui-border-base flex items-center justify-between gap-x-2 rounded-lg border px-2.5 py-1.5">
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Marka profilinden {brandUsed.length} alan otomatik
                </Text>
                {onEditBrand && (
                  <button
                    type="button"
                    onClick={onEditBrand}
                    className="text-ui-fg-interactive text-xs font-medium hover:underline"
                  >
                    Düzenle
                  </button>
                )}
              </div>
            )}

            <div className={clx("grid gap-2", wide ? "sm:grid-cols-2" : "grid-cols-1")}>
              {selected.variables
                .filter((name) => name !== "LANGUAGE" && !BRAND_SET.has(name))
                .map((name) => (
                  <VariableField
                    key={name}
                    name={name}
                    meta={meta?.variables[name]}
                    value={vars[name] ?? ""}
                    onChange={(v) =>
                      setVars((prev) => ({ ...prev, [name]: v }))
                    }
                  />
                ))}
            </div>
          </div>

          {/* SAĞ: 3·Üret — canlı önizleme, örnek, üret */}
          <div className="flex flex-col gap-y-3">
            {/* Canlı prompt önizlemesi — doldurdukça gerçek prompt oluşur */}
            <div className="flex flex-col gap-y-1.5">
              <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                Prompt önizleme
              </Text>
              <div className="bg-ui-bg-subtle border-ui-border-base text-ui-fg-subtle max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg border p-2.5 font-mono text-xs leading-relaxed">
                {promptPreview}
              </div>
              {selected.output?.shape && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  Üretecek: {selected.output.shape}
                </Text>
              )}
            </div>

            {/* Örnek gör yalnız "sıfırdan üretir" promptlarda anlamlı (girdisiz önizleme).
                "Görselini kullanır" promptlar senin yüklediğin görseli ister. */}
            {selected.mode === "generate" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleExample}
                  isLoading={exampleMut.isPending}
                  disabled={exampleMut.isPending}
                >
                  <Sparkles />
                  Örnek gör
                </Button>
                {exampleMut.isPending && (
                  <Text size="xsmall" className="text-ui-fg-muted text-center">
                    Örnek üretiliyor… (görsel örneği ~20-30 sn sürebilir)
                  </Text>
                )}
              </>
            ) : (
              <div className="bg-ui-tag-blue-bg border-ui-tag-blue-border text-ui-tag-blue-text flex items-start gap-x-2 rounded-lg border p-2.5">
                <Photo className="mt-0.5 shrink-0" />
                <Text size="xsmall">
                  Bu prompt <b>senin yüklediğin görseli kullanır</b>. Soldan görseli
                  ekleyip "Görsel üret"e bas — ekranını koruyup çerçeve, başlık ve
                  markayı üstüne kurar.
                </Text>
              </div>
            )}
            {exampleMut.data && (
              <div className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-y-1.5 rounded-lg border p-2.5">
                <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                  Örnek çıktı
                </Text>
                {exampleMut.data.kind === "image" ? (
                  <img
                    src={exampleMut.data.image}
                    alt="Örnek"
                    className="mx-auto max-h-72 w-auto rounded-md object-contain"
                  />
                ) : (
                  <Text size="small" className="text-ui-fg-base max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {exampleMut.data.text}
                  </Text>
                )}
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleRun}
              isLoading={isPending}
              disabled={isPending || imageBlocked}
              className="transition-transform duration-100 ease-out active:scale-[0.98]"
            >
              <Sparkles />
              {kind === "image" ? "Görsel üret" : "Metni üret"}
            </Button>
            {imageBlocked && (
              <Text size="xsmall" className="text-ui-fg-muted text-center">
                Üretmek için önce soldan bir görsel ekle.
              </Text>
            )}
            {isPending && (
              <div className="text-ui-fg-subtle flex items-center gap-x-2">
                <Spinner className="animate-spin" />
                <Text size="small">
                  {kind === "image" ? "Görsel üretiliyor…" : "Metin üretiliyor…"}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
