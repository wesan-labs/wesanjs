import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useRef } from "react"

// mapcn motoru: MapLibre GL + bedava CARTO basemap (API key yok), theme-aware.
const STYLE_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
const STYLE_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

export type MapMarker = {
  lng: number
  lat: number
  label: string
  value: number
  display?: string
}

type MapPanelProps = {
  markers: MapMarker[]
  height?: number
}

const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark")

export const MapPanel = ({ markers, height = 320 }: MapPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: isDark() ? STYLE_DARK : STYLE_LIGHT,
      center: [10, 25],
      zoom: 1.1,
      attributionControl: false,
    })
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    )
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    const draw = () => {
      markerRefs.current.forEach((m) => m.remove())
      markerRefs.current = []
      if (!markers.length) {
        return
      }
      const max = Math.max(...markers.map((m) => m.value), 1)
      markers.forEach((mk) => {
        const size = 12 + (mk.value / max) * 22
        const el = document.createElement("div")
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.borderRadius = "9999px"
        el.style.background = "rgba(59,130,246,0.45)"
        el.style.border = "2px solid #3b82f6"
        el.style.cursor = "pointer"
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([mk.lng, mk.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: false }).setText(
              `${mk.label}: ${mk.display ?? mk.value}`
            )
          )
          .addTo(map)
        markerRefs.current.push(marker)
      })

      if (markers.length === 1) {
        map.easeTo({ center: [markers[0].lng, markers[0].lat], zoom: 2.5 })
      } else {
        const bounds = new maplibregl.LngLatBounds()
        markers.forEach((m) => bounds.extend([m.lng, m.lat]))
        map.fitBounds(bounds, { padding: 48, maxZoom: 4, duration: 500 })
      }
    }

    if (map.loaded()) {
      draw()
    } else {
      map.once("load", draw)
    }
  }, [markers])

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg"
      style={{ width: "100%", height }}
    />
  )
}
