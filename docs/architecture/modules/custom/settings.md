# settings — Admin panel yapılandırma (görünüm/tercih/etiket)   [✅ Çalışır]

## Ne yapar
Admin panelde hangi kolonun gösterileceğini, kullanıcının sıralama/filtre tercihini ve alan etiketi override'larını yönetir. Joiner-config üzerinden entity keşfi yapıp kolonları otomatik üretir.

## Tür & katman
Modül · servis katmanı · tenant_id yok.

## Mimari / katmanlar
| Katman | Var mı | Sayı / İçerik |
|--------|--------|---------------|
| models | ✅ | 3 model (ViewConfiguration, UserPreference, PropertyLabel) |
| services | ✅ | 18+ metod, 479 satır |
| repositories | — | — |
| loaders | — | — |
| migrations | ✅ | 2 migration |
| api | ❌ | yok |
| admin | ❌ | yok |

Ek: utils 6 (entity-discovery, render-mode-mapper, column-generator, relationship-filters, entity-overrides, computed-columns).

## Veri modeli
- **ViewConfiguration** — bir entity için görünüm/kolon yapılandırması.
- **UserPreference** — kullanıcı bazlı sıralama/filtre tercihleri.
- **PropertyLabel** — alan etiketi override'ları.

Doğrulama: `is_system_default` ↔ `user_id` mutual exclusive.

## Public yüzey
- ViewConfiguration CRUD + `upsertWithReplace`
- UserPreference CRUD
- PropertyLabel CRUD
- `listDiscoverableEntities`
- `hasEntity`
- `generateEntityColumns` — joiner-config'den kolon üret
- `onApplicationStart` — init

## Bağımlılıklar & linkler
Joiner-config / entity şema katmanına bağlı (entity discovery + kolon üretimi). Doğrudan başka modül bağımlılığı yok.

## Durum
- **Yapılan:** Full service + entity discovery + computed-columns + overrides + validation (is_system_default ↔ user_id mutual exclusive).
- **Yapılmayan / eksik:** API route, admin UI (kolon seçici).
- **Yapılacak (sıralı):**
  1. API (view-configs/{entity} GET/PUT/POST)
  2. Admin kolon-seçici (drag/drop) + label editor
  3. Default view config şablonları

## Hizmet ettiği dikeyler
Admin panel UX (yatay, tüm dikeyler).

## Kanıt yolları
- `packages/modules/settings/src/models`
- `packages/modules/settings/src/services`
- `packages/modules/settings/src/utils`
- `packages/modules/settings/src/migrations`
