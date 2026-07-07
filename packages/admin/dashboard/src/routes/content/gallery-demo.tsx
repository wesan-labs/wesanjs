import { Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { TemplateGallery } from "./components/template-gallery"

/**
 * Faz 4 görsel doğrulama demosu — TemplateGallery: markaya-önerili template
 * ızgarası. domain kutusuna iş alanı yaz ("kahve", "saas") → sıra değişir
 * (recommendTemplates). Karta tıkla → seçim (Faz 2 fill'e gidecek). Kredisiz.
 */
export const Component = () => {
  const [domain, setDomain] = useState("artisan kahve cafe")

  return (
    <Container className="p-6">
      <div className="mb-4 flex flex-col gap-y-1">
        <Heading level="h2">Template galerisi demosu (Faz 4)</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Marka alanını değiştir → öneri sırası değişir. Format sekmeleriyle süz. Karta tıkla → seçim.
        </Text>
      </div>

      <div className="mb-4 max-w-sm">
        <Text size="small" weight="plus" className="mb-1">Marka alanı (domain)</Text>
        <Input
          size="small"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="ör. artisan kahve · b2b saas · fitness"
        />
      </div>

      <TemplateGallery
        domain={domain.trim() || undefined}
        onPick={(t) => toast.success("Template seçildi", { description: `${t.label} · ${t.format}` })}
      />
    </Container>
  )
}
