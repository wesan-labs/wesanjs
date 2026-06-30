# revenue — Abonelik + reklam geliri agregasyonu (RevenueCat + AdMob)   🟡 Kısmi (çalışan)

## Ne yapar
RevenueCat (iOS/Android abonelik) + AdMob (reklam) verisini toplar, günlük snapshot alır, P&L raporu üretir.

## Tür & katman
- **Tür:** plugin (revenue)
- **Katman:** domain / gelir analitiği (agregasyon + raporlama)
- **tenant_id taşıyor mu:** Hayır

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 5 (RevenueEvent, MetricSnapshot, App, RevenueSource, Expense) |
| services | ✅ | 49 metod (552 satır) |
| api | ✅ | 14 route |
| admin | 🔴 | YOK |
| workflows | — | yok |
| jobs | ✅ | 2 (sync-revenuecat, sync-admob) |
| migrations | ✅ | 5 migration |

Ek: 2 connector · 6 lib.

## Veri modeli
- **RevenueEvent** — source_id, kind (SUBSCRIPTION_INITIAL|RENEWAL|ONE_TIME|REFUND), gross_amount, occurred_at, raw_payload
- **MetricSnapshot** — date, app_id, platform (ios|android|all), source_type (revenuecat|admob), mrr, active_subscriptions, active_trials, gross_revenue, net_revenue, expense_total, net_profit, currency
- **App**
- **RevenueSource** — config
- **Expense**

## Public yüzey
- **service:** `recordEvents`, `upsertDailySnapshot`, `recordSnapshot`, `getAppsOverview`, `getAppDetail`, `getAdBreakdown`, `getOverview` (P&L: MRR + abonelik + reklam − komisyon[Apple 30 / Google 30] − vergi = net)
- **API:** 14 route — overview, charts, apps, ad-breakdown, expenses, settings, integrations, sync, webhooks

## Bağımlılıklar & linkler
- Connector: RevenueCat + AdMob
- İlgili spec'ler (link):
  - [../../specs/REVENUE-SPEC.md](../../specs/REVENUE-SPEC.md)
  - [../../specs/REVENUE-INTEGRATIONS.md](../../specs/REVENUE-INTEGRATIONS.md)
  - [../../specs/REVENUE-PLAN-slice1.md](../../specs/REVENUE-PLAN-slice1.md)

## Durum
- **Yapılan:** veri + API + job + hesaplama — gerçek gelir raporu motoru.
- **Yapılmayan/eksik:** admin UI; **subscription lifecycle** (trial→renewal→dunning→cancel) yok = şu an sadece "geliri topla"; webhook secret tanımlı ama doğrulama kodu yok; proration logic yok; retry/circuit-breaker yok.
- **Yapılacak (sıralı):**
  1. admin dashboard
  2. RevenueCat/AdMob webhook handler
  3. proration/refund flow
  4. dunning
  5. tax-local
  6. test

## Hizmet ettiği dikeyler
SaaS/app, üyelik/topluluk, eğitim, fitness, DTC-abonelik.

## Kanıt yolları
- `packages/plugins/revenue/src/modules/revenue/service.ts`
- `packages/plugins/revenue/src/api`
- `packages/plugins/revenue/src/lib`
- `packages/plugins/revenue/src/connectors`
