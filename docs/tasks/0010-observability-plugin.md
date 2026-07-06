# 0010 — Levios Builtin Analytics (ADR-0003 rev.)

| | |
|---|---|
| **Durum** | 🟡 MVP tamamlandı — vertical derinlik bekliyor |
| **Öncelik** | Orta-Yüksek |
| **Etiket** | analytics · multi-tenant · builtin-ingest |
| **ADR** | [0003-hosted-vertical-analytics.md](../adr/0003-hosted-vertical-analytics.md) |
| **Engine spec** | [analytics.md](../architecture/modules/custom/analytics.md) |
| **Kullanım** | [vertical-analytics.md](../observability/vertical-analytics.md) |

## Amaç

Platform işletimli analitik: varsayılan **`builtin`** mod — event'ler `analytics_event` tablosunda, günlük özet `analytics_metric_snapshot` üzerinden panelde. Tenant env / BYOK yok. Opsiyonel `hosted` mod: tek `platform` bloğu ile PostHog + GlitchTip (ileride).

## Bitti sayılır (MVP)

- [x] ADR-0003 + builtin pivot dokümante
- [x] `analytics_event`, `analytics_metric_snapshot`, `analytics_bootstrap_token` model + migration
- [x] RLS migration (`Migration20260706190000`)
- [x] Bootstrap token rotate + `GET /analytics/v1/config` + `POST /analytics/v1/events`
- [x] Günlük sync job (builtin aggregate, seed yok)
- [x] `/analytics`: ürün ekle (isim + vertical), KPI, trend, huni, bootstrap snippet
- [x] BYOK observability bridge silindi; Connections Sentry satırı kaldırıldı
- [x] `verify-analytics-pilot.ts` — bootstrap → ingest → sync → tenant isolation

---

## Faz 0 — Doc & temizlik

- [x] ADR-0003
- [x] vertical-analytics.md
- [x] Entegrasyonlar: Sentry satırı kaldırıldı
- [x] `revenue` observability bridge silindi
- [ ] ADR-0002, analytics.md tam güncel (builtin öncelik notu)

## Faz 1 — Engine çekirdek (builtin)

- [x] `@medusajs/analytics` modülü
- [x] `AnalyticsService` — ingest, bootstrap, snapshot upsert
- [x] `platform-config` — `builtin` \| `hosted`
- [x] RLS: `analytics_*` tabloları
- [ ] `@medusajs/analytics-plugin` paketine route taşıma (şu an revenue altında)

## Faz 2 — Sync + API

- [x] Job: builtin event → DAU, funnel step, crash snapshot
- [x] `GET/POST /admin/analytics/products`, overview, funnel, sync
- [x] Hosted PostHog/GlitchTip sync lib (opsiyonel mod, deploy bekliyor)

## Faz 3 — Admin UI

- [x] Ürün ekle: isim + vertical
- [x] `/analytics` — ürün dropdown + vertical şablon v1
- [x] Bootstrap token göster / rotate / SDK snippet
- [x] Revenue ile aynı ürün satırı (RevApp paylaşımı)

## Faz 4 — Vertical derinlik

- [ ] Oyun: level funnel, D1/D7 retention şablonu
- [ ] App: onboarding hunisi + RC kart köprüsü
- [ ] Web: sayfa hunisi + UTM
- [ ] Thin SDK client (Expo / Unity)

## Faz 5 — Hosted ops (opsiyonel)

- [ ] PostHog + GlitchTip docker / provisioning
- [ ] `platform.mode: hosted` pilot
- [ ] BYOK external connection (enterprise)

---

## Bağımlılıklar

- ADR-0001 tenant + RLS (#0004, #0005)
- Revenue `RevApp` ürün satırı (mevcut)
- Isolation pilot (#0009) — verify script için

## Bilinçli dışarıda (MVP)

- Tenant başına env anahtarı
- Entegrasyonlar matrisi analytics sütunları
- Demo seed snapshot (kaldırıldı — yalnız gerçek event)

## Referans kod

- Engine: `packages/modules/analytics/`
- Geçici routes: `packages/plugins/revenue/src/api/admin/analytics/`, `api/analytics/v1/`
- Sync: `packages/plugins/revenue/src/api/lib/analytics-sync.ts`, `jobs/sync-analytics.ts`
- Verify: `packages/medusa/src/migration-scripts/verify-analytics-pilot.ts`
- UI: `packages/admin/dashboard/src/routes/analytics/`

## Doğrulama

```bash
cd /Users/canakyuz/Developer/wesan/levios/wesanjs/packages/medusa && yarn build
cd /Users/canakyuz/Developer/wesan/levios/helm
yarn db:migrate
npx medusa db:migrate:scripts
# verify-analytics-pilot.js — bootstrap → ingest → sync → tenant isolation
```

Önce isolation pilot seed gerekir (`seed-isolation-pilot.js` aynı `db:migrate:scripts` ile çalışır).
