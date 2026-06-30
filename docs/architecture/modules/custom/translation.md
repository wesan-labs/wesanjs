# translation — Çoklu-dil entity çevirisi   [✅ Çalışır]

## Ne yapar
Locale yönetimi, çeviri string deposu, per-entity translatable field registry ve DML taramasıyla otomatik keşif sağlar. Hangi entity'lerin hangi alanlarının çevrilebilir olduğunu DML şemasından otomatik bulur, çeviri değerlerini saklar ve istatistik üretir.

## Tür & katman
Modül · servis katmanı · tenant_id yok.

## Mimari / katmanlar
| Katman | Var mı | Sayı / İçerik |
|--------|--------|---------------|
| models | ✅ | 3 model (Locale, Translation, TranslationSettings) |
| services | ✅ | 11 metod, 754 satır |
| repositories | — | — |
| loaders | ✅ | defaults loader |
| migrations | ✅ | 4 migration |
| api | ❌ | yok |
| admin | ❌ | yok |

Ek: utils 2, DML scan.

## Veri modeli
- **Locale** — desteklenen dil tanımları.
- **Translation** — `entity_type`, `entity_id`, `field`, `locale`, `value`. Tek bir entity alanının bir locale'deki çeviri değeri.
- **TranslationSettings** — çevrilebilir alan kayıtları / yapılandırma.

## Public yüzey
- Locale CRUD
- Translation CRUD
- `retrieveTranslation`
- `getTranslatableFields`
- `getStatistics`
- `getInactiveTranslatableFields`
- `onApplicationStart` — `DmlEntity.getTranslatableEntities` taraması + settings sync

## Bağımlılıklar & linkler
DML şema katmanına bağlı (translatable entity keşfi için). Doğrudan başka modül bağımlılığı yok.

## Durum
- **Yapılan:** Full service layer, DML entity taraması, settings auto-sync, locale + translation storage, alan-sayısı istatistiği.
- **Yapılmayan / eksik:** API route, admin UI, entity-hydration hook (entity load'da otomatik çeviri uygulama), CSV import/export.
- **Yapılacak (sıralı):**
  1. API (locales, translations batch)
  2. Admin editor grid
  3. Entity hydration hook
  4. CSV import/export

## Hizmet ettiği dikeyler
Çok-dilli her dikey (mağaza / klinik / portal i18n).

## Kanıt yolları
- `packages/modules/translation/src/models`
- `packages/modules/translation/src/services`
- `packages/modules/translation/src/loaders`
- `packages/modules/translation/src/migrations`
