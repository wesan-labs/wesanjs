# ADR-0003 — Hosted Vertical Analytics (PostHog + GlitchTip)

- **Durum:** Kabul (2026-07-06)
- **Önceki:** [ADR-0002](0002-analytics-engine-observability-shell.md) — BYOK broker modeli **kısmen geçersiz**
- **Bağlam:** Tek tenant içinde 4–5+ ürün (oyun, app, web); ileride çok müşteri (tenant)
  izolasyonu. Kullanıcı beklentisi: panelde huni, retention, crash özeti — **5 ayrı
  SaaS entegrasyonu değil**. Mevcut `@medusajs/analytics-posthog` monorepo'da var;
  BYOK matrisi (Sentry/Aptabase hücreleri) UX olarak reddedildi.

## Karar

1. **Hosted analytics — varsayılan.** Platform tek (veya küme başına) **PostHog self-host**
   + **GlitchTip self-host** işletir. Tenant başına PostHog **project**, ürün başına
   **group** (veya ayrı project — büyük tenant'larda). Tenant `.env` / DSN / App Key
   girmez.
2. **İki OSS motor — net ayrım.**
   - **PostHog (MIT):** davranış — event, huni, retention, cohort, paths, A/B, replay.
   - **GlitchTip (MIT):** hata — crash, stack trace, release health; **Sentry SDK uyumlu**.
3. **Vertical pack — Wesan farkı.** Fork değil **config + şema + dashboard şablonu:**
   - `mobile_game` — level funnel, D1/D7 retention, ad/IAP event'leri
   - `mobile_app` — onboarding hunisi, RC ile birleşik kartlar
   - `web` — sayfa hunisi, UTM, conversion
4. **`@medusajs/analytics` = engine.** Product registry, bootstrap token, PostHog/GlitchTip
   provisioning API, günlük **snapshot sync** (Revenue `metric_snapshot` pattern), tenant
   scope. BYOK `AnalyticsConnection` matrisi **enterprise opsiyonel** — MVP'de yok.
5. **Analytics plugin kabuğu** (`@medusajs/analytics-plugin` veya mevcut observability
   adı): HTTP + `/analytics` UI. Engine'e delege; modeller engine'de.
6. **Ürün kaynağı — Faz 1:** Revenue `RevApp` satırları + `vertical` + `runtime` alanları.
   Faz 2: `AnalyticsProduct` ayrı tablo (gerekirse).
7. **Entegrasyonlar matrisinden analytics sütunları kaldırılır** (Sentry/Aptabase BYOK).
   Revenue sütunları (RC, AdMob) kalır.

## Reddedilen alternatifler (ADR-0002'den devralınan / yeni)

| Alternatif | Neden red |
|------------|-----------|
| Tenant BYOK matrisi (DSN/App Key hücreleri) | UX yorucu; "analytics ürünü" hissi vermiyor |
| Aptabase primary motor | Free 1 app; huni/cohort zayıf; PostHog kapsar |
| Sentry self-host primary | 7–16 GB RAM, 20+ container, BSL; GlitchTip yeterli |
| Sıfırdan event DB + huni motoru | PostHog/OpenPanel zaten var; reinvent yok |
| Sadece dış dashboard linkleri | Kullanıcı panelde grafik bekliyor |
| ADR-0002 tam broker (veri wesan'de yok) | Özet KPI + huni panelde olmalı |

## Mimari

```
┌──────────────── Tenant A (Wesan Studio) ─────────────────┐
│  RevApp: Oyun1, Oyun2, App1, Web1, Web2                  │
│  vertical: mobile_game | mobile_app | web              │
└──────────────────────────┬───────────────────────────────┘
                           │ bootstrap token (tenant_id + product_id)
┌──────────────────────────▼───────────────────────────────┐
│  @medusajs/analytics ENGINE                              │
│  · ProductService (RevApp + vertical)                    │
│  · BootstrapService (SDK init config)                    │
│  · SnapshotSyncJob → analytics_metric_snapshot             │
│  · PostHogAdminClient / GlitchTipAdminClient (provision) │
└──────────────┬─────────────────────┬─────────────────────┘
               │                     │
     ┌─────────▼─────────┐   ┌───────▼────────┐
     │ PostHog (self-host)│   │ GlitchTip      │
     │ project: tenant_a  │   │ org: tenant_a  │
     │ group: product_id  │   │ project/prod   │
     └─────────┬─────────┘   └───────┬────────┘
               │                     │
               └──────────┬──────────┘
                          │ API sync (günlük + cache)
┌─────────────────────────▼──────────────────────────────┐
│  Analytics PLUGIN SHELL + Dashboard `/analytics`           │
│  · Ürün dropdown · vertical dashboard şablonu              │
│  · DAU, funnel, crash-free %, event trend                  │
│  · Revenue ile aynı tenant scope                           │
└────────────────────────────────────────────────────────────┘

┌──────────────── Tenant B (Müşteri X) ──── aynı stack, ayrı PH project ─┐
```

## Tenant izolasyonu

| Katman | Mekanizma |
|--------|-----------|
| API | `x-tenant-id` + membership guard (mevcut) |
| Postgres | `tenant_id` + RLS on `analytics_metric_snapshot`, bootstrap tokens |
| PostHog | **Ayrı project** tenant başına; API key tenant row'da (platform yönetir) |
| GlitchTip | **Ayrı org/project** tenant başına |
| SDK bootstrap | Token → `{ tenant_id, product_id }` — cross-tenant write imkansız |
| UI cache | `useTenantQueryKey` (mevcut) |

Tenant A, Tenant B PostHog project'ine erişemez. Ürün ayrımı aynı project içinde
`product_id` group property ile.

## OSS seçimi — gerekçe

| Motor | Lisans | Rol | Self-host RAM (yaklaşık) |
|-------|--------|-----|--------------------------|
| PostHog | MIT | Davranış, huni, retention | 2–4 GB+ (hobby ~100k evt/ay) |
| GlitchTip | MIT | Crash, Sentry SDK uyum | 512 MB–2 GB |
| GameAnalytics | SaaS | Oyun vertical derinlik | Connector/sync only (Faz 3) |

Kaynak: [PostHog GitHub](https://github.com/PostHog/posthog),
[GlitchTip backend](https://gitlab.com/glitchtip/glitchtip-backend),
[vertical-analytics.md](../observability/vertical-analytics.md) §6.

## Veri modeli (hedef)

### analytics_metric_snapshot (Revenue pattern)

Günlük rollup — panel grafikleri buradan; detay PostHog/GlitchTip UI embed veya API.

| Alan | Tip | Açıklama |
|------|-----|----------|
| tenant_id | text | RLS |
| product_id | text | RevApp id |
| date | date | UTC gün |
| source | enum | `posthog` \| `glitchtip` \| `gameanalytics` |
| metric | text | `dau`, `crash_count`, `crash_free_rate`, `funnel_step_*` |
| value | numeric | |
| dimensions | jsonb | platform, version, … |

**Unique:** `(tenant_id, product_id, date, source, metric, dimensions_hash)`

### analytics_bootstrap_token

| Alan | Tip |
|------|-----|
| tenant_id, product_id | text |
| token_hash | text |
| rotated_at | timestamp |

### Enterprise opsiyonel (Faz 4+): analytics_external_connection

BYOK — kendi PostHog/Sentry URL'leri. Varsayılan akışta kullanılmaz.

## Admin UX (hedef)

1. **Ürün ekle** — Entegrasyonlar veya `/analytics` → isim + vertical (oyun/app/web)
2. **Otomatik** — PostHog group + GlitchTip project provision (arka plan)
3. **Bootstrap** — panelden token kopyala → Unity/Expo/Next snippet
4. **`/analytics`** — ürün seç → vertical dashboard (grafikler, huni, crash kartı)
5. **Revenue** — aynı ürün satırında gelir + kullanım yan yana (ileride)

**Yok:** matris hücresi başına DSN, Aptabase key, 5 dashboard linki.

## Public API (plan)

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/admin/analytics/products` | Tenant ürünleri + vertical |
| POST | `/admin/analytics/products` | Ürün + vertical; provision tetikler |
| GET | `/admin/analytics/overview` | Snapshot + canlı özet |
| GET | `/admin/analytics/products/:id/funnel` | Vertical huni tanımı + sonuç |
| POST | `/admin/analytics/products/:id/bootstrap/rotate` | Token rotate |
| GET | `/analytics/v1/config` | Public bootstrap (Bearer token) |

## Uygulama sırası

1. **ADR + doc** — bu dosya; ADR-0002 not; task #0010 güncelle
2. **Infra** — PostHog + GlitchTip docker (helm / infra repo)
3. **Engine Faz 1** — `analytics_metric_snapshot`, BootstrapService, PostHog relay tenant-aware
4. **Sync job** — PostHog API → snapshot; GlitchTip issue count → snapshot
5. **`/analytics` UI** — vertical şablon v1 (oyun + web)
6. **Matris temizliği** — Sentry/Aptabase BYOK UI kaldır; geçici revenue bridge deprecate
7. **Faz 2** — GameAnalytics connector; Metabase embed opsiyonel
8. **Faz 3** — Enterprise BYOK (isteğe bağlı)

## Sonuçlar

- ✅ Tek panelde huni + crash özeti; entegrasyon yorgunluğu düşük
- ✅ 4–5 proje = 5 satır, 1 tenant, dropdown ile geçiş
- ✅ Multi-customer: tenant = PostHog project sınırı
- ✅ Mevcut PostHog provider genişletilebilir
- ⚠️ Platform infra maliyeti (VPS) — tenant başına değil, cluster başına
- ⚠️ PostHog self-host ops — Cloud MVP sonra migrate mümkün
- ⚠️ Geçici BYOK kodu (`revenue` observability bridge) silinecek

## İlgili dokümanlar

- [analytics.md](../architecture/modules/custom/analytics.md) — engine spec (güncellendi)
- [observability.md](../architecture/plugins/observability.md) — shell spec (güncellendi)
- [0010-observability-plugin.md](../tasks/0010-observability-plugin.md) — checklist
- [vertical-analytics.md](../observability/vertical-analytics.md) — kullanım rehberi
- ADR-0001 — multi-tenancy
