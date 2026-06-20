import { DomainPlaceholder } from "../domains/domain-placeholder"

export const Component = () => {
  return (
    <DomainPlaceholder
      title="Analytics"
      description="Tüm domain'lerden gelen verinin birleştiği analiz katmanı. Veri kaynakları bağlanınca dolacak."
      planned={[
        "Funnel & cohort analizi",
        "Event tracking",
        "Tenant bazlı custom dashboard'lar",
      ]}
    />
  )
}
