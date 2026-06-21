import { MetricGrid } from "../dashboards/metrics"

export const Component = () => {
  return (
    <div className="flex flex-col gap-y-3">
      <MetricGrid
        metrics={[
          { label: "Toplam Müşteri", value: "0", sub: "Tüm zamanlar" },
          { label: "Bu Ay Yeni", value: "0", sub: "Son 30 gün" },
          { label: "Müşteri Grubu", value: "0", sub: "Aktif" },
          { label: "Aktif", value: "0", sub: "Son 30 gün" },
        ]}
      />
    </div>
  )
}
