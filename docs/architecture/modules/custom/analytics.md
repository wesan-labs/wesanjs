# analytics — Pluggable analytics provider relay   [🟡 Kısmi]

## Ne yapar
Segment vb. tracking aracını Medusa event'lerine bağlar ve track/identify çağrılarını yapılandırılmış provider'a yönlendirir. Bir adapter/proxy katmanı; kendi veri persistence'ı yok.

## Tür & katman
Modül · servis katmanı (persistence yok) · tenant_id yok.

## Mimari / katmanlar
| Katman | Var mı | Sayı / İçerik |
|--------|--------|---------------|
| models | ❌ | YOK (persistence yok) |
| services | ✅ | 2 service (AnalyticsService: track/identify/shutdown; AnalyticsProviderService: DI provider routing) |
| repositories | — | — |
| loaders | ✅ | providers loader |
| migrations | ❌ | YOK |
| api | ❌ | yok |
| admin | ❌ | yok |

Ek: types (IAnalyticsProvider).

## Veri modeli
YOK — modül veri saklamaz, çağrıları dış provider'a relay eder.

## Public yüzey
- `track()`
- `identify()`
- `shutdown()`
- Provider DI discovery (`aly_*` prefix), validation (tam 1 provider gerekli), `onApplicationShutdown` graceful.

## Bağımlılıklar & linkler
Dış analytics provider'ı (Segment vb.) `IAnalyticsProvider` arayüzü üzerinden DI ile bağlanır. Tam 1 provider zorunlu.

## Durum
- **Yapılan:** Adapter/proxy layer tam, provider abstraction (IAnalyticsProvider), DI-driven discovery, error handling.
- **Yapılmayan / eksik:** VERİ MODELİ YOK, persistence yok, event logging/audit yok, API, admin, migration.
- **Yapılacak (sıralı):**
  1. Event modeli (actor_id, event_type, properties, timestamp, tenant_id)
  2. Logging service (log/filter/export)
  3. API (events)
  4. Predefined events registry
  5. Admin viewer + CSV export

## Hizmet ettiği dikeyler
Tüm dikeyler (analitik yatay).

## Kanıt yolları
- `packages/modules/analytics/src/services`
- `packages/modules/analytics/src/loaders`
- `packages/modules/analytics/src/types`
