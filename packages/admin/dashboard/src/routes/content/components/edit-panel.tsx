import { Sparkles } from "@medusajs/icons"
import { Button, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"

/** Right-panel control: free-text image editing. Editing runs in the parent. */
export const EditPanel = ({
  onApply,
  busy,
  disabled,
}: {
  onApply: (prompt: string) => Promise<void>
  busy: boolean
  disabled?: boolean
}) => {
  const [prompt, setPrompt] = useState("")

  const handleEdit = async () => {
    if (!prompt.trim() || busy || disabled) {
      return
    }
    try {
      await onApply(prompt.trim())
      setPrompt("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Görsel düzenlenemedi")
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <Sparkles className="text-ui-fg-interactive" />
        <Text weight="plus">Görseli düzenle</Text>
      </div>
      <Textarea
        placeholder="Ne yapılsın? Örn: arka planı kaldır, ürünü ahşap masaya koy, sıcak ışık ver"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={disabled}
        rows={4}
      />
      <Button
        variant="primary"
        onClick={handleEdit}
        disabled={!prompt.trim() || busy || disabled}
        isLoading={busy}
        className="transition-transform duration-100 ease-out active:scale-[0.98]"
      >
        <Sparkles />
        Düzenle ve uygula
      </Button>
      <Text size="xsmall" className="text-ui-fg-muted">
        {disabled
          ? "Üretmek için önce soldan bir görsel ekle."
          : "Her düzenleme yeni bir versiyon olur; orijinal hep durur."}
      </Text>
    </div>
  )
}
