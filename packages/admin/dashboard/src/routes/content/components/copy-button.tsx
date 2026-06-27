import { CheckMini, SquareTwoStack } from "@medusajs/icons"
import { IconButton, Tooltip, toast } from "@medusajs/ui"
import { useState } from "react"

/**
 * Copies text to the clipboard with transient visual feedback.
 * Single responsibility: clipboard + toast + 1.5s checkmark swap.
 */
export const CopyButton = ({
  value,
  label = "Kopyala",
}: {
  value: string
  label?: string
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success("Panoya kopyalandı")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Kopyalanamadı")
    }
  }

  return (
    <Tooltip content={label}>
      <IconButton size="small" variant="transparent" onClick={handleCopy}>
        {copied ? <CheckMini className="text-ui-fg-interactive" /> : <SquareTwoStack />}
      </IconButton>
    </Tooltip>
  )
}
