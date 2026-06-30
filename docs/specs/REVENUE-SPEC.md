# revenue — Monetization Plugin Spec (v0, review'e açık)

> revenue = **Can'ın kendi uygulama portföyünün** finans panosu: çok-kaynaklı abonelik + tek-seferlik gelir toplama, manuel gider, net P&L.
> wesanjs (Medusa fork) üstünde **tam-yığın plugin** olarak; `loyalty` şablonundan kopya. E-ticaret siparişi DEĞİL.
> Kardeş spec'ler: [HELM-SPEC.md], [WESANJS-SPEC.md]. Bu plugin onların `plugins[]` listesine eklenir.

---

## 1. Durum — dürüst envanter

**Var (kanıt):**
- Çalışan host: `helm/` = "Medusa app file-linked to the wesanjs fork" (`medusa develop`, tüm `@medusajs/*` → `file:../wesanjs/packages/*`). WESANJS-SPEC'in "apps/host yok" notu **bayat** — host helm.
- Plugin şablonu: `wesanjs/packages/plugins/{loyalty,draft-order}` (ikisi de helm'de file-linked).
- RBAC: `packages/modules/rbac` + declarative `definePolicies` (boot'ta auto-sync, migration'sız).
- Dashboard kit: `routes/dashboards/kit` (DashboardHeader, MetricGrid, Widget, ChartPanel, DataTable, states).

**Yok:**
- ❌ Abonelik/billing/MRR backend'i (Medusa çekirdeği tek-seferlik sipariş; abonelik yok).
- ❌ Chart kütüphanesi (`ChartPanel` placeholder; Recharts planlı ama kurulu değil).
- ❌ `revenue` plugin'i. Mevcut `routes/revenue` + `routes/adsense` = shell'e hardcode edilmiş keşif stub'ları (sabit veri).

**Araştırma bulgusu (sağlayıcılar):**
- **RevenueCat** App Store + Google Play + **Stripe + Paddle**'ı tek API'de toplar, `/v2/.../metrics/overview` ile **hazır MRR** + aktif abonelik + 28g gelir verir; webhook'lu; hem native hem USD. iyzico'yu **desteklemez**.
- Stripe (v2 Analytics) hazır MRR verebilir (plan-gated); Paddle vermez (hesaplanır) + **Merchant of Record** (gelir = brüt değil net `earnings`).
- Reklam geliri = AdSense (web) ≠ **AdMob** (mobil in-app) → `ads` plugin'inin işi.

**Çıkarım:** Frontend kabuğu kolay %10; iş = var olmayan veri kaynağını bağlamak. RevenueCat tek entegrasyonla 4 sağlayıcıyı çözdüğü için **ilk dilim oradan başlar**.

---

## 2. Hedef & Model

`revenue` = sağlayıcı-bağımsız **finansal toplama omurgası**. Her sağlayıcı = bir **connector**; çekirdek değişmeden yeni connector eklenir (iyzico bugün örnek, yarın Paddle/başkası).

```
Harici kaynaklar        Connector (normalize)       Kanonik defter          Görünüm
RevenueCat ─webhook─┐
Stripe/Paddle ──────┼──► RevenueConnector SPI ──► revenue_event ─────► /revenue panosu
iyzico ─────poll────┤    (sağlayıcı = 1 dosya)    (+ expense,          (MRR, gelir, gider, NET)
manuel gider ───────┘                              metric_snapshot)
```

`ads` plugin'i (admob/applovin) **aynı SPI'yı** kullanır ama ayrı plugin (reklam ≠ abonelik). İki panel, tek omurga deseni.

---

## 3. Mimari Kararlar (kilitli)

| # | Karar | Gerekçe |
|---|---|---|
| R1 | revenue = **kendi plugin'i** (`packages/plugins/revenue`), app-management'a gömülmez | tek sorumluluk; ads zaten ayrı |
| R2 | UI **plugin-injected** admin route (shell forklanmaz) | WESANJS K3; standalone satılabilir; hardcode stub plugin'e taşınır |
| R3 | **RevenueCat-first ince dilim** (Approach A): minimal model + 1 connector + gider + 1 gerçek grafik | bitirme problemine panzehir; tek entegrasyon → gerçek rakam |
| R4 | Kanonik defter (`revenue_event`) + **Connector SPI** | sağlayıcı-bağımsızlık burada yaşar |
| R5 | Para = **`model.bigNumber`** (Medusa para konvansiyonu — arbitrary precision, float DEĞİL); raporlama birimi = **mevcut store varsayılan para birimi** (panel ayarından, yeni ayar icat edilmez); FX yalnız kaynak≠varsayılan olunca | codebase pattern (gift-card.ts kanıtı); float yasak (CLAUDE.md §3); mevcut ayarı tüket (DRY) |
| R6 | **Tek-tenant** (Can'ın portföyü, `tenant_id`/RLS YOK) + **RBAC-gated** | "ben + Finance rolü" → izin katmanı yeter |
| R7 | Idempotent ingestion: **UNIQUE(source_id, external_id)** upsert | webhook tekrarı/çift sayma O(1) engellenir |
| R8 | Rename EN SONDA (`@medusajs/* → @wesanjs/*`) | WESANJS K1/D4'ü miras alır |

---

## 4. Ne Nereye

```
wesanjs/packages/plugins/revenue/        # ★ loyalty'den kopya-değiştir
└── src/
    ├── modules/revenue/
    │   ├── models/  revenue-source.ts · revenue-event.ts · expense.ts · metric-snapshot.ts
    │   ├── services/ revenue-module-service.ts   # MedusaService({...})
    │   ├── connectors/ connector.ts (SPI) · revenuecat.ts   # Slice 1
    │   ├── migrations/ · loaders/ · index.ts (Module("revenue", {...}))
    ├── api/admin/revenue/
    │   ├── overview/route.ts            # GET → snapshot + recent events + gider toplamı
    │   ├── expenses/route.ts            # GET/POST gider
    │   └── middlewares.ts               # permission guard
    ├── api/webhooks/revenuecat/route.ts # POST → verify → parseWebhook → upsert event
    ├── admin/routes/revenue/            # plugin-injected UI (stub buradan taşınır)
    ├── jobs/sync-revenuecat.ts          # günlük metrics pull
    └── workflows/                       # gerekirse

helm/
├── package.json   → +"@medusajs/revenue-plugin": "file:../wesanjs/packages/plugins/revenue"
├── medusa-config   → plugins:[ ..., { resolve: "@medusajs/revenue-plugin" } ]
└── .env           → REVENUECAT_API_KEY, REVENUECAT_WEBHOOK_SECRET, REVENUECAT_PROJECT_ID

wesanjs/packages/admin/dashboard/  → Recharts ekle (package.json); hardcode revenue stub'ı kaldırılır (R2)
policies (revenue, expense) → tercihen plugin İÇİNDEN Policy global'e katkı (self-contained); mümkün değilse `packages/medusa/src/policies/revenue.ts` (A5)
```

Mevcut `packages/{core,modules,admin,design-system}` = DOKUNMA (Recharts dep'i + stub kaldırma hariç), yeniden kullan.

---

## 5. Veri Modeli (kanonik defter)

Para her zaman `model.bigNumber` (Medusa konvansiyonu — arbitrary precision, float değil; gift-card.ts pattern'i). Tablolar:

- **`revenue_source`** — bağlı sağlayıcı. `id, type('revenuecat'|'stripe'|'paddle'|'iyzico'|'manual'), name, status, credentials_ref (sır DB'de değil → .env/secrets referansı), last_synced_at, last_cursor, last_error, metadata(jsonb)`.
- **`revenue_event`** — defterin kalbi. `id, source_id(fk), source_type, external_id, app_id(nullable), kind('subscription_initial'|'renewal'|'one_time'|'refund'|'ad_earning'), status, gross_amount, tax_amount, fee_amount, net_amount, currency, reporting_amount, fx_rate(nullable), occurred_at, raw_payload(jsonb), created_at`.
  - **UNIQUE(source_id, external_id)** → idempotent upsert (R7). İndeks: `(occurred_at)`, `(app_id, occurred_at)`, `(kind)`.
- **`expense`** — manuel gider. `id, app_id(nullable=genel), category('infra'|'api'|'ads'|'other'), description, amount, currency, reporting_amount, occurred_at, recurring(bool), created_by, created_at`.
- **`metric_snapshot`** — günlük okuma modeli (cache). `id, date, app_id(nullable=all), source_type(nullable=all), mrr, active_subscriptions, active_trials, gross_revenue, net_revenue, ad_revenue, expense_total, net_profit, currency, computed_at`.
  - **UNIQUE(date, app_id, source_type)** → pano her açılışta ham toplamaz, **O(1)** okur.
- *(Faz sonrası)* `app` (uygulama boyutu), `subscription` (kendi MRR hesabı için), `fx_rate(date, base, quote, rate)`.

---

## 6. Connector SPI

```ts
interface RevenueConnector {
  type: RevenueSourceType
  fetchMetrics?(): Promise<ProviderMetrics>        // hazır MRR veren (RevenueCat, Stripe v2)
  backfill?(range: DateRange): AsyncIterable<CanonicalEvent>  // poll (iyzico, AdMob, Paddle)
  parseWebhook?(req): CanonicalEvent[]             // gerçek-zaman (RevenueCat, Stripe, Paddle, Apple)
  verifyWebhook?(req): boolean
}
```
Slice 1 = `RevenueCatConnector`: `fetchMetrics()` (overview → hazır MRR) + `parseWebhook()` + `verifyWebhook()`. Yeni sağlayıcı = bu arayüzü uygulayan tek dosya; çekirdek/model değişmez.

---

## 7. Slice 1 — kapsam & kabul (RevenueCat)

**Akış:**
```
Günlük job → RevenueCatConnector.fetchMetrics()  → upsert metric_snapshot (mrr, active_subs, 28g gelir)
RC webhook → /webhooks/revenuecat → verify → parseWebhook → upsert revenue_event (idempotent)
Gider formu → POST /admin/revenue/expenses → expense
Pano açılış → GET /admin/revenue/overview → son snapshot + son event'ler + gider toplamı → NET
```

**Kabul kriterleri:**
1. `revenue` plugin helm config'ine register; `medusa develop` boot ediyor; migration'lar koşuyor.
2. `revenue:read` izinli kullanıcı `/revenue`'da **gerçek MRR + aktif abonelik + 28g gelir** görüyor (RevenueCat, "örnek veri" rozeti kalkmış).
3. En az 1 **gerçek Recharts grafiği** (MRR/gelir trendi, `metric_snapshot`'tan); kabuk = mevcut `ChartPanel` (izole swap).
4. `expense:write` izinli kullanıcı gider girebiliyor; pano **NET = gelir − gider** gösteriyor.
5. RevenueCat webhook'u `revenue_event` yazıyor (idempotent); "son işlemler" listede; tekrar gelen webhook çift satır YARATMIYOR.

---

## 8. RBAC

- `packages/medusa/src/policies/revenue.ts`: `definePolicies(generateResourcePolicies(["revenue", "expense"]))` → otomatik `revenue:read/write/...`, `expense:read/write/...` (boot'ta rbac auto-sync, migration yok).
- Pano izni **`revenue:read`**, gider girme **`expense:write`**.
- Route guard: `handle: { permissions: "revenue:read" }` + `<RoutePermissionGuard />`; admin API aynı izni middleware'de kontrol eder.
- **Finance rolü** = bu iki izne sahip rol (owner her şeyi görür).

---

## 9. Frontend

- Recharts `dashboard/package.json`'a eklenir; `ChartPanel` içine gerçek grafik (kabuk aynı).
- Plugin'in `admin/routes/revenue`'sı shell'e inject olur; hardcode `routes/revenue` stub'ı + get-route.map/main-layout girdileri kaldırılır (R2).
- `useRevenueOverview()` hook'u → `GET /admin/revenue/overview`; yükleniyor/boş/hata = mevcut `kit/states`.

---

## 10. Fazlar

- **Slice 1 — RevenueCat:** §7 (gerçek MRR + gider + net + 1 grafik). **Bitiş = çalışan dilim.**
- **Faz 2 — Stripe (direkt):** v2 Analytics MRR / abonelik+charge+refund; webhook.
- **Faz 3 — Paddle:** transactions omurga; MoR **brüt vs net** kararı.
- **Faz 4 — iyzico:** poll + FX (TRY→USD), `fx_rate` tablosu.
- **Faz 5 — ads plugin (AdMob):** reklam geliri aynı SPI'yla; `source='ad_earning'`.
- **Faz 6 — kendi MRR hesabı:** `subscription` tablosu (Paddle/iyzico gibi hazır MRR vermeyenler için).

---

## 11. Güvenlik & Karmaşıklık (CLAUDE.md §3/§14)

- Para `model.bigNumber` (float değil); FX `reporting_amount`'ta dondurulur (geçmiş değişmez).
- Idempotency: `UNIQUE(source_id, external_id)` → upsert **O(1)**, çift sayma yapısal olarak imkânsız.
- Pano okuma: `metric_snapshot` UNIQUE index → dönem başına **O(1)**, ham event taranmaz.
- Sırlar `.env`/secrets'ta; DB'de yalnız `credentials_ref`. Webhook imzası `verifyWebhook` ile doğrulanır.
- PII yok (toplu finans metrikleri); log'da ham payload maskeli.

---

## 12. Açık Kararlar (review'de)

- **A1 — Raporlama birimi:** ✅ ÇÖZÜLDÜ — mevcut store varsayılan para birimi (panel ayarından okunur, R5). Kaynak (RevenueCat) ≠ varsayılan ise FX o noktada devreye girer. Sorulmayacak.
- **A2 — Sır saklama:** Slice 1 `.env` (helm). İleride çok-hesap olursa secrets manager / şifreli kolon kararı.
- **A3 — helm medusa-config:** plugin register satırının tam yeri/biçimi plan fazında doğrulanacak (config dosyası okunacak).
- **A4 — Spec senkronu:** `revenue` plugin'i WESANJS-SPEC §4 `plugins[]` listesine eklensin mi (app-management/ads/crm/cms yanına)?
- **A5 — Policy nereden register:** Plugin kendi policy'sini Policy global'e katabiliyor mu (self-contained, core'a dokunmaz = tercih), yoksa core `policies/`'e mi yazmak gerekecek? Plan fazında rbac `syncRegisteredPolicies` + plugin loader sırası doğrulanacak.
