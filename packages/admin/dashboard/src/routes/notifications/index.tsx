import { DomainPlaceholder } from "../domains/domain-placeholder"

export const Component = () => {
  return (
    <DomainPlaceholder
      title="Notifications"
      description="Bildirim merkezi. Medusa'da notification modülü var ama panel arayüzü henüz bağlı değil."
      planned={[
        "Kanal yönetimi (email / push / SMS)",
        "Şablon editörü",
        "Gönderim geçmişi & durum",
      ]}
    />
  )
}
