import { DomainPlaceholder } from "../domains/domain-placeholder"

export const Component = () => {
  return (
    <DomainPlaceholder
      title="CMS"
      description="Sayfa ve içerik yönetimi. Henüz arkasında bir CMS modülü yok; sidebar yapısı hazır."
      planned={[
        "Sayfa / blok editörü",
        "Medya kütüphanesi",
        "Yayın akışı (taslak → yayında)",
      ]}
    />
  )
}
