# ADR-0002 — Observability: `@medusajs/analytics` engine + ince plugin kabuğu

> **Kısmen geçersiz (2026-07-06):** BYOK broker modeli ve Entegrasyonlar matrisi
> [ADR-0003](0003-hosted-vertical-analytics.md) ile değiştirildi. Engine + plugin shell
> ayrımı **geçerli**; varsayılan dağıtım artık **hosted PostHog + GlitchTip**.

- **Durum:** Kabul (2026-07-04) · BYOK kısmı superseded by ADR-0003
- **Bağlam:** Müşteriler (tenant) mobil oyun, mobil app, web sitesi, desktop uygulamalarını
  panelden harici analitik/crash araçlarına bağlayacak. Kısıtlar: **ücretsiz (BYOK)**,
  **`.env` yok**, **tenant izolasyonu**, **Entegrasyonlar matrisi UI**. Mevcut
  `@medusajs/analytics` modülü yalnızca tek global PostHog relay; persistence ve
  `tenant_id` yok.

## Karar

1. **`@medusajs/analytics` = engine (genişletilmiş modül).** Modeller, tenant-scoped
   connection registry, secret encryption, dynamic provider resolution ve bootstrap
   config servisi bu pakette yaşar.
2. **`@medusajs/observability-plugin` = ince kabuk.** Yalnızca HTTP API route'ları,
   admin UI wiring (Entegrasyonlar matrisi sütunları, `/analytics` sayfası) ve helm
   plugin kaydı. İş mantığı `Modules.ANALYTICS` üzerinden çözülür.
3. **Broker modeli — veri wesan'de kalmaz.** Platform crash/usage dashboard göstermez;
   tenant kendi Sentry / Aptabase / GameAnalytics hesabında görür. wesan sadece
   şifreli anahtar saklar ve runtime'da dağıtır.
4. **Tek registered provider kuralı korunur — içi dinamik.** `medusa-config`'te
   `DynamicAnalyticsProvider` kayıtlı kalır; tenant+product başına N connection DB'den
   çözülür (payment modülündeki çoklu `pp_*` kaydının tersi: dışarı tek kapı, içeride
   routing).
5. **Ayrı observability plugin'de duplicate engine yapılmaz.** Modeller ve provider
   relay analytics modülünde; plugin HTTP + UI only.

## Reddedilen alternatifler

| Alternatif | Neden red |
|------------|-----------|
| Sadece `@medusajs/analytics` (plugin yok) | Modül HTTP route ve React UI barındıramaz |
| Sadece `observability-plugin` (modül kullanılmaz) | Provider relay duplication; `Modules.ANALYTICS` boşa kalır |
| Global `.env` / `medusa-config` statik key | Tenant BYOK ile çelişir |
| Platform tek PostHog hesabı | 1000 tenant izolasyonu yok; maliyet platformda |

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│ packages/modules/analytics/          ENGINE                  │
│  AnalyticsProduct, AnalyticsConnection (tenant_id + RLS)    │
│  ConnectionService — save/list/bootstrap/verify             │
│  DynamicAnalyticsProvider → Aptabase / Sentry / GA relay    │
│  track() / identify() — tenant-aware                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ container.resolve(Modules.ANALYTICS)
┌──────────────────────────▼──────────────────────────────────┐
│ packages/plugins/observability/      SHELL (~HTTP + UI)       │
│  POST/GET /admin/observability/*                            │
│  GET /observability/v1/products/:id/config (bootstrap)      │
│  Entegrasyonlar matrisi sütunları + /analytics sayfası      │
└─────────────────────────────────────────────────────────────┘
```

## Gerekçe

- **Mevcut abstraction:** `IAnalyticsProvider`, `track`/`identify`, provider loader
  zaten var — genişletmek sıfırdan plugin engine yazmaktan ucuz.
- **Payment modülü precedents:** Çoklu provider registry, DB-backed provider kaydı —
  analytics için aynı pattern uyarlanabilir.
- **Medusa katman ayrımı:** Modül = veri + servis; Plugin = API + admin UI. CLAUDE.md
  akışına uygun: `Module → API Route (plugin) → Admin UI`.
- **Geriye uyumluluk:** Mevcut PostHog/local provider boot-time relay korunabilir;
  tenant BYOK dynamic path paralel eklenir.

## Sonuçlar

- ✅ Tek `Modules.ANALYTICS` resolve noktası; workflow/subscriber'lardan `track()` kullanılabilir.
- ✅ Tenant BYOK, matris UI, bootstrap API hedefi karşılanır.
- ✅ wesan platform analytics maliyeti $0 (tenant kendi free tier hesabını açar).
- ⚠️ `@medusajs/analytics` breaking-ish genişleme: modeller, migrations, RLS, provider refactor.
- ⚠️ İki paket koordinasyonu (modül + plugin) — API sözleşmesi dokümante edilmeli.
- 📋 Sonraki adım: `/analytics` admin sayfası + Entegrasyonlar matrisi wiring (task #0010).

## Provider sütunları (tenant BYOK)

| Sütun | Kategori | Ücretsiz tier |
|-------|----------|---------------|
| Sentry | errors | 5K error/ay |
| Firebase Crashlytics | errors (mobil/oyun) | Sınırsız |
| Aptabase | usage | 20K event/ay, 1 app |
| GameAnalytics | game_metrics | Free indie |
| PostHog | usage (ileri) | 1M event/ay |

## Sıralama

1. Analytics modülü: modeller + ConnectionService + RLS
2. `DynamicAnalyticsProvider` + aptabase/sentry relay providers
3. Observability plugin: admin API + bootstrap endpoint
4. Admin UI: Entegrasyonlar matrisi sütunları
5. Admin UI: `/analytics` sayfası (ürün listesi + provider dashboard linkleri)
6. Opsiyonel: event audit log (modül persistence)

## İlgili dokümanlar

- [analytics.md](../architecture/modules/custom/analytics.md) — modül spec (güncellenecek)
- [observability.md](../architecture/plugins/observability.md) — plugin kabuğu spec
- [light-analytics-integration.md](../observability/light-analytics-integration.md) — entegrasyon rehberi
- [0010-observability-plugin.md](../tasks/0010-observability-plugin.md) — uygulama checklist
- ADR-0001 — multi-tenancy (`tenant_id` + RLS omurgası)
