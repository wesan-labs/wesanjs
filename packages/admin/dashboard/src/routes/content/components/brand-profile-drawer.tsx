import { Button, Drawer, Input, Select, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { usePrompts } from "../../../hooks/api/content"
import { BRAND_VARS, BrandProfile } from "./brand-profile"

const FRIENDLY: Record<string, string> = {
  BRAND_NAME: "Marka adı",
  BRAND_VOICE: "Marka sesi / ton",
  PRODUCT_NAME: "Ürün adı",
  PRODUCT_CATEGORY: "Ürün kategorisi",
  KEY_FEATURE: "Öne çıkan özellik",
  BENEFIT: "Ana fayda",
  TARGET_AUDIENCE: "Hedef kitle",
  TONE: "Varsayılan ton",
  CTA: "Çağrı (CTA)",
  OFFER: "Teklif / kampanya",
  COLOR: "Marka rengi",
  INTERIOR_STYLE: "Stil",
  HASHTAG_COUNT: "Hashtag sayısı",
  WEBSITE: "Web sitesi",
  SOCIAL: "Sosyal hesap",
}

/** One-time brand profile editor; values auto-fill every prompt afterwards. */
export const BrandProfileDrawer = ({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: BrandProfile
  onSave: (p: BrandProfile) => void
}) => {
  const { data } = usePrompts({}, { enabled: open })
  const meta = data?.meta
  const [draft, setDraft] = useState<BrandProfile>(profile)

  useEffect(() => {
    if (open) {
      setDraft(profile)
    }
  }, [open, profile])

  const set = (name: string, v: string) =>
    setDraft((prev) => ({ ...prev, [name]: v }))

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Marka Profili</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          <Text size="small" className="text-ui-fg-subtle">
            Bir kez doldur — tüm prompt'lara otomatik dolar. Her üretimde markanı
            yeniden yazmazsın.
          </Text>
          {BRAND_VARS.map((name) => {
            const m = meta?.variables[name]
            const options = m?.values ?? m?.enum_example
            return (
              <div key={name} className="flex flex-col gap-y-1.5">
                <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                  {FRIENDLY[name] ?? name}
                </Text>
                {options?.length ? (
                  <Select
                    value={draft[name] || undefined}
                    onValueChange={(v) => set(name, v)}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder={m?.example ?? "Seç"} />
                    </Select.Trigger>
                    <Select.Content>
                      {options.map((o) => (
                        <Select.Item key={o} value={o}>
                          {o}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                ) : (
                  <Input
                    placeholder={m?.example}
                    value={draft[name] ?? ""}
                    onChange={(e) => set(name, e.target.value)}
                  />
                )}
              </div>
            )
          })}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">İptal</Button>
          </Drawer.Close>
          <Button
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
          >
            Kaydet
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
