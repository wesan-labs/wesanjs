/**
 * Intent taksonomisi — dikey-BAĞIMSIZ pazarlama amaçları (mimari v2 §5).
 *
 * Bunlar "hero/lifestyle/detail/social" gibi amaçlardır, sektör değil. Şablonlar
 * yalnız generik slot içerir ({SUBJECT}, {AUDIENCE}) — bunlar markadan + vision'dan
 * dolar. Böylece AYNI intent seti kahve kavurucusu, diş kliniği ya da B2B SaaS için
 * çalışır: kimse dikey-özel şablon yazmaz.
 */

export interface IntentDef {
  id: string
  label: string
  mode: "transform" | "generate"
  aspect: string
  /** {SUBJECT}/{AUDIENCE} generik slotlu iskelet — marka bloğu ayrıca prepend edilir. */
  template: string
}

export const INTENTS: IntentDef[] = [
  {
    id: "hero",
    label: "Hero / kapak",
    mode: "generate",
    aspect: "4:5",
    template:
      "A striking hero marketing key visual of {SUBJECT}, bold heroic composition, strong focal subject, premium polished render, clear space for a headline, --ar 4:5",
  },
  {
    id: "lifestyle",
    label: "Yaşam / kullanım",
    mode: "transform",
    aspect: "4:3",
    template:
      "Keep the provided subject intact; place {SUBJECT} in an authentic real-world setting used by {AUDIENCE}, warm natural light, editorial lifestyle photography, do NOT alter the product itself, --ar 4:3",
  },
  {
    id: "detail",
    label: "Detay",
    mode: "transform",
    aspect: "1:1",
    template:
      "Keep the provided subject intact; a close-up detail shot of {SUBJECT} showing texture, material and craftsmanship, shallow depth of field, do NOT alter the product, --ar 1:1",
  },
  {
    id: "social-cover",
    label: "Sosyal kapak",
    mode: "transform",
    aspect: "9:16",
    template:
      "Use the provided {SUBJECT} as the hero of a vertical scroll-stopping social cover, keep it intact; leave bold space for a hook headline; high contrast, thumb-stopping; do NOT redraw the subject, --ar 9:16",
  },
  {
    id: "feature-callout",
    label: "Özellik vurgusu",
    mode: "transform",
    aspect: "4:5",
    template:
      "Keep the provided {SUBJECT} intact; add 2-3 clean callout labels pointing to key features, minimal modern layout for {AUDIENCE}, do NOT redraw the subject, --ar 4:5",
  },
]

/** Intent'i id ile getir. */
export const getIntent = (id: string): IntentDef | undefined =>
  INTENTS.find((i) => i.id === id)
