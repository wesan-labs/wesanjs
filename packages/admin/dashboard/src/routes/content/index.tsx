import { DomainPlaceholder } from "../domains/domain-placeholder"

export const Component = () => {
  return (
    <DomainPlaceholder
      title="Content"
      description="İçerik oluşturma ve planlama. İki giriş yolu: dosya yükleyerek ya da hazır oluşturulmuş içeriği seçerek."
      planned={[
        "İçerik planlama takvimi",
        "Yükleyerek içerik ekleme",
        "Hazır şablondan seçme",
        "AI ile içerik üretme",
      ]}
    />
  )
}
