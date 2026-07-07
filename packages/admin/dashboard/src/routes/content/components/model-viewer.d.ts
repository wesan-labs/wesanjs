import type { DetailedHTMLProps, HTMLAttributes } from "react"

// <model-viewer> web component'inin JSX tipi (loose — birçok attribute var).
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string
          alt?: string
          "camera-controls"?: boolean
          "auto-rotate"?: boolean
          "shadow-intensity"?: string | number
          exposure?: string | number
          "camera-orbit"?: string
          ar?: boolean
        },
        HTMLElement
      >
    }
  }
}

export {}
