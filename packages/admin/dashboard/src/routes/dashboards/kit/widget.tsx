import { Container, Heading, clx } from "@medusajs/ui"
import { ReactNode } from "react"

type WidgetProps = {
  title?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

// Her dashboard widget'ının ortak kabuğu: başlık + opsiyonel sağ-üst aksiyon +
// gövde. Tek yerde tanımlı; tablo/liste/grafik hepsi bunu sarar.
export const Widget = ({ title, action, className, children }: WidgetProps) => {
  return (
    <Container className={clx("flex flex-col gap-y-4 p-6", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title ? (
            <Heading level="h2" className="text-ui-fg-base">
              {title}
            </Heading>
          ) : (
            <span />
          )}
          {action ?? null}
        </div>
      )}
      {children}
    </Container>
  )
}
