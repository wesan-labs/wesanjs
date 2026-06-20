import { Text } from "@medusajs/ui"

export const EmptyState = ({ label = "Kayıt yok" }: { label?: string }) => {
  return (
    <div className="flex h-32 items-center justify-center">
      <Text size="small" className="text-ui-fg-muted">
        {label}
      </Text>
    </div>
  )
}
