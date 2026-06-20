import { DomainPlaceholder } from "../domains/domain-placeholder"

export const Component = () => {
  return (
    <DomainPlaceholder
      title="Social Media"
      description="Sosyal medya yönetimi. Hesap bağlama ve zamanlama modülü henüz yok; sidebar yapısı hazır."
      planned={[
        "Instagram / TikTok hesap bağlama",
        "Gönderi zamanlama",
        "Etkileşim & erişim analizi",
      ]}
    />
  )
}
