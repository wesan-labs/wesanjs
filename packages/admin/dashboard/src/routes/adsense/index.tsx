import { DomainPlaceholder } from "../domains/domain-placeholder"

export const Component = () => {
  return (
    <DomainPlaceholder
      title="AdSense"
      description="Reklam geliri ve kampanya takibi. Reklam sağlayıcı entegrasyonu henüz yok; sidebar yapısı hazır."
      planned={[
        "AdSense / reklam hesabı bağlama",
        "Gelir & tıklama raporları",
        "Yerleşim yönetimi",
      ]}
    />
  )
}
