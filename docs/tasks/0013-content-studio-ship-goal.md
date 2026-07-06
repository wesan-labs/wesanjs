# 0013 — Content Studio: Ship Hedefi (NORTH-STAR)

| | |
|---|---|
| **Tür** | Goal / north-star (goal-method çıpası) |
| **Durum** | 🎯 Aktif |
| **Mimari** | [content-studio-adaptive-engine.md](../architecture/content-studio-adaptive-engine.md) (v2, §20 inşa sırası) |
| **Ürün niyeti** | [content-studio.md](../../../helm/docs/content-studio.md) |

## North-star (tek cümle)

**Gerçek bir kullanıcı, markasını kurup medyasını yükleyip — yazmadan seçerek — yayına hazır bir içerik üretebilsin, düzenleyebilsin, planlayıp paylaşabilsin.** Uçtan uca, kullanılabilir, çalışan dilim.

## Bitti sayılır (Definition of Done — kullanıcı yolculuğu)

Bir kullanıcı, tek oturumda, hiç prompt yazmadan şunu tamamlayabilir:
1. **Marka kur** (bir kez) → `BrandIdentity` kaydedilir.
2. **Medya yükle** → analiz → markadan uygun **çıktı tipleri** önerilir.
3. **Üret** → deterministik, marka-tutarlı görsel/metin.
4. **Düzenle** → AI çıktısını yayın öncesi rötuşla (crop/aspect/text/logo).
5. **Planla** → takvime al (veya hemen).
6. **Paylaş** → bağlı hesaba yayınla.

Bu altı adım **kesintisiz** çalışıyorsa hedef vurulmuştur.

## Goal-method kuralı

- Her iş bu north-star'a karşı ölçülür. **Hizmet etmeyen iş yapılmaz** (başka alanlar — analytics/revenue/rbac — bu turda dondu).
- Sıra: **audit → önceliklendir → doğrulanmış dilim.** Her dilim tek başına "kullanıcı yolculuğunu bir adım daha kesintisiz yaptı mı?" sorusuyla test edilir.
- Kredi-gated adımlar (gerçek görsel üretim) işaretlenir; kredisiz doğrulanabilen (compose determinism, editör, takvim UI) önce.

## Pipeline durumu — SHIP dilimi tamamlandı (2026-07-06)

| Adım | Durum | Not |
|------|-------|-----|
| ⓪ Marka | ✅ nudge (keşfedilebilir) | kurulum UI düz model — BrandIdentity redesign'e ertelendi |
| ① Üret | ✅ tek pack akışı, oto-compose | gerçek görsel = kredi (Gemini/OpenRouter) |
| Düzenle | ✅ **Filerobot editörü** (crop/aspect/text/logo/filtre) | lazy-load; Can görsel doğrular |
| ② Metin | ✅ | marka-sesi few-shot = sonra |
| Planla | 🟡 tek-gönderi zamanlama | lokal takvim = bilinçli sonra (audit: L) |
| ③ Paylaş | ✅ dead-end kapandı (hesap CTA) | hesap bağlama + medya = env/imageHost |
| Ölç/besle | — | post-metric + döngü = adaptif faz |

**SHIP dilimi commit'leri (#0013):** görsel-sadeleştirme `6cfe5f6` · paylaş-dead-end `f81e064` · marka-nudge `9d75177` · **Filerobot editör** `dac19d2` · empty-state+stepper `f6332cb`. Hepsi typecheck-temiz.

**DoD journey artık uçtan-uca traversable** (kod seviyesinde). Kalan: Can'ın görsel doğrulaması + runtime-gated parçalar (kredi, hesap bağlama).

## Sonraki faz (ship sonrası — adaptif v2)

BrandIdentity derleyici (§20 adım 1-2) · kit üretim · feedback döngüsü · video editör (OpenCut) · lokal takvim. Bunlar shippable dilimin ÜSTÜNE gelen roadmap; ship'i bloke etmez.

## Referans sıra (v2 §20)

BrandIdentity şema → L1 derleyici → image editör → kit → takvim/variant → feedback → video/batch.
Bu goal turunda **ship'e en kısa yol** öncelikli (audit çıktısı sırayı kesinleştirir).

---

*Oluşturuldu: 2026-07-06 · goal-method çıpası*
