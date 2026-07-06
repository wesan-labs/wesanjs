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

## Pipeline durumu (audit girdisi)

| Adım | Var mı | Boşluk |
|------|--------|--------|
| ⓪ Marka | brand-profile.ts (localStorage, düz BRAND_VARS) | `BrandIdentity` şema (domain≠enum) + UI |
| ① Üret | Pack engine + PackPicker/ShotPreview (Faz 1-3) ✅ | pack elle-yazım → derleyici (adaptif); UX yoğunluğu |
| Düzenle | `runEdit`/versions var | **Editör YOK** (Filerobot) |
| ② Metin | prompt-library ✅ | marka sesi few-shot |
| Planla | — | **Takvim/slot YOK** |
| ③ Paylaş | Zernio publish ✅ | per-platform variant |
| Ölç/besle | account-snapshot | post-metric + döngü YOK |

## Referans sıra (v2 §20)

BrandIdentity şema → L1 derleyici → image editör → kit → takvim/variant → feedback → video/batch.
Bu goal turunda **ship'e en kısa yol** öncelikli (audit çıktısı sırayı kesinleştirir).

---

*Oluşturuldu: 2026-07-06 · goal-method çıpası*
