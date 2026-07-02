// CMS SEO paneli — entry.data.seo {title, description, keywords[], ogImage}.
// Char sayaçları + keyword chip'leri + OG önizleme + client-side sağlık (AI yok).
// AI "Üret" Faz 3 (cms.seo.generateSoon). Tüm metinler i18n (cms.seo.*).

import { useState } from "react"
import { Button, Input, Label, Text, Textarea } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

type Seo = {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
}

const inRange = (n: number, min: number, max: number) => n >= min && n <= max

export const SeoPanel = ({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) => {
  const { t } = useTranslation()
  const seo = value as Seo
  const title = seo.title ?? ""
  const description = seo.description ?? ""
  const keywords = Array.isArray(seo.keywords) ? seo.keywords : []
  const ogImage = seo.ogImage ?? ""
  const [kwInput, setKwInput] = useState("")

  const set = (patch: Partial<Seo>) => onChange({ ...seo, ...patch })

  const addKeyword = () => {
    const k = kwInput.trim()
    if (k && !keywords.includes(k)) {
      set({ keywords: [...keywords, k] })
    }
    setKwInput("")
  }

  const titleOk = inRange(title.length, 30, 60)
  const descOk = inRange(description.length, 70, 160)
  const kwOk = keywords.length > 0
  const ogOk = ogImage.trim().length > 0

  const Counter = ({ n, max, ok }: { n: number; max: number; ok: boolean }) => (
    <span
      className="text-xs tabular-nums"
      style={{ color: ok ? "#10b981" : "#a1a1aa" }}
    >
      {t("cms.seo.chars", { count: n, max })}
    </span>
  )

  const Check = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-x-2">
      <span style={{ color: ok ? "#10b981" : "#f59e0b" }}>
        {ok ? "✓" : "⚠"}
      </span>
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
    </div>
  )

  return (
    <div className="flex flex-col gap-y-5">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">
          {t("cms.seo.tab")}
        </Text>
        <Button
          size="small"
          variant="secondary"
          disabled
          title={t("cms.seo.generateSoon")}
        >
          {t("cms.seo.generate")}
        </Button>
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <Label size="small" weight="plus">
            {t("cms.seo.title")}
          </Label>
          <Counter n={title.length} max={60} ok={titleOk} />
        </div>
        <Input
          value={title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder={t("cms.seo.titlePh")}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <Label size="small" weight="plus">
            {t("cms.seo.description")}
          </Label>
          <Counter n={description.length} max={160} ok={descOk} />
        </div>
        <Textarea
          value={description}
          rows={3}
          onChange={(e) => set({ description: e.target.value })}
          placeholder={t("cms.seo.descriptionPh")}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label size="small" weight="plus">
          {t("cms.seo.keywords")}
        </Label>
        {keywords.length ? (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span
                key={k}
                className="bg-ui-bg-component text-ui-fg-subtle flex items-center gap-x-1 rounded-full px-2 py-0.5 text-xs"
              >
                {k}
                <button
                  type="button"
                  className="hover:text-ui-fg-base"
                  onClick={() =>
                    set({ keywords: keywords.filter((x) => x !== k) })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <Input
          value={kwInput}
          onChange={(e) => setKwInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addKeyword()
            }
          }}
          placeholder={t("cms.seo.keywordsPh")}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label size="small" weight="plus">
          {t("cms.seo.ogImage")}
        </Label>
        <Input
          value={ogImage}
          onChange={(e) => set({ ogImage: e.target.value })}
          placeholder={t("cms.seo.ogImagePh")}
        />
        {ogImage.trim() ? (
          <img
            src={ogImage}
            alt=""
            loading="lazy"
            className="bg-ui-bg-subtle h-28 w-full max-w-[320px] rounded-md border object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = ""
            }}
          />
        ) : null}
      </div>

      <div className="border-ui-border-base flex flex-col gap-y-2 rounded-lg border p-3">
        <Text
          size="xsmall"
          weight="plus"
          className="text-ui-fg-muted uppercase tracking-wider"
        >
          {t("cms.seo.health")}
        </Text>
        <Check
          ok={titleOk}
          label={titleOk ? t("cms.seo.titleOk") : t("cms.seo.titleWarn")}
        />
        <Check
          ok={descOk}
          label={descOk ? t("cms.seo.descOk") : t("cms.seo.descWarn")}
        />
        <Check
          ok={kwOk}
          label={kwOk ? t("cms.seo.kwOk") : t("cms.seo.kwWarn")}
        />
        <Check
          ok={ogOk}
          label={ogOk ? t("cms.seo.ogOk") : t("cms.seo.ogWarn")}
        />
      </div>
    </div>
  )
}
