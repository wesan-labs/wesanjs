# Revenue — Entegrasyon Kataloğu

Bu doküman, revenue/finans panelinin **olası tüm entegrasyonlarını** tek yerde
toplar: ne işe yaradığı, nasıl bağlandığı (auth), hangi veriyi verdiği, zorluğu,
mevcut durumu ve öncelik. Amaç: tek kişilik stüdyonun birçok mobil
uygulama/oyununda **net P&L** (gelir − gider) görebilmesi.

> Kapsam: `packages/plugins/revenue` (Medusa v2 plugin) + `packages/admin/dashboard`
> (revenue sayfası + Entegrasyonlar matrisi).

---

## 1. Mimari — bir entegrasyon nasıl bağlanır

Her entegrasyon aynı dört parçadan oluşur:

```
Connector            Sync (job + manuel)        Saklama                 UI
─────────            ──────────────────         ───────                 ──
connectors/x.ts  →   lib/sync-x.ts          →   metric_snapshot     →   matris sütunu
(API çağrısı,        (kimlik çöz, çek,          (gün gün, app|         (per-product)
 normalize)           app'e eşle, yaz)           platform|source)        VEYA
                                                 + revenue_source        üst buton
                                                   (kimlik/ayar)          (account-level)
```

- **Connector** (`modules/revenue/connectors/`): dış API ile konuşur, ham veriyi
  bizim tipe (`AdRow`, `ProviderMetrics`, `ChartPoint`) çevirir. Saf, yan etkisiz.
- **Sync** (`modules/revenue/lib/sync-*.ts`): kimlik bilgisini çözer (şifreli DB →
  yoksa `.env`), connector'ı çağırır, satırları ürüne eşler (`external_ids`),
  **gün gün** snapshot yazar. Cron job (`jobs/`) + manuel tetik (`/admin/revenue/sync`).
- **Saklama**:
  - `revenue_metric_snapshot` — günlük metrikler. Anahtar: `(date, app_id, platform, source_type)` UNIQUE. Alanlar: `gross_revenue`, `ad_revenue`, `ad_impressions`, `mrr`, `active_subscriptions`, `active_trials`, `new_customers`, `active_users`, `currency`.
  - `revenue_source` — kimlik bilgisi + ayar. `provider`, `category`, `config` (açık), `secret_enc` (AES-256-GCM, JWT_SECRET'tan türetilmiş anahtar). `provider="settings"` → komisyon/vergi.
- **UI** iki kalıp:
  - **Matris sütunu** (per-product) — her ürün için ayrı bağlantı (ör. RevenueCat project_id). `connections/index.tsx` → `INTEGRATIONS[]`.
  - **Üst buton + drawer** (account-level) — bir kez kurulur, tüm ürünler paylaşır (ör. AdMob OAuth hesabı, Email, Finans).

**Para birimi:** her snapshot kendi native birimini taşır; gösterim `Money`
bileşeniyle store-default birime canlı kur (Frankfurter) ile çevrilir. Backend
P&L'i `fx.ts` ile display birimine normalize eder.

**Takvim-ayı:** gelir gün gün saklandığı için "bu ay / geçen ay" (takvim 1→bugün)
doğru toplanır; AdMob/RevenueCat konsoluyla birebir tutar.

---

## 2. Durum efsanesi

| İşaret | Anlam |
|---|---|
| ✅ | Çalışıyor, canlı veri |
| 🟡 | İskelet var (UI sütunu/buton) ama bağlı değil |
| ❌ | Yok |

**Auth zorluğu:** 🟢 kolay (API key) · 🟡 orta (OAuth / service account) · 🔴 zor (JWT/.p8, çok adımlı)

---

## 3. Katalog

### 3.1 Abonelik / IAP geliri

#### RevenueCat — ✅ · 🟢
- **Verir:** MRR, aktif abonelik, trial, yeni müşteri, aktif kullanıcı, gelir (gün gün, mağaza/ülke segmentli).
- **Auth:** API key (Bearer) + project_id. Her ürün **ayrı proje** → per-product (matris sütunu).
- **API:** `GET /v2/projects/{id}/metrics/overview`, `GET /v2/projects/{id}/charts/{metric}` (`segment=store|country`, `resolution=day`, `start_date/end_date`). measure 0 = Revenue, measure 1 = Transactions.
- **Eşleme:** `gross_revenue` (gün gün, platform=all + platform=ios/android), MRR vb. anlık.
- **Not:** Abonelik geliri **App Store + Play Store + Stripe**'ı kapsar; ayrıca mağaza entegrasyonu gerektirmez (gelir için). Komisyon RC'de düşülmez → Finans'tan girilir.

#### Apple App Store Connect — ❌ · 🔴
- **Verir:** Resmi satış raporları, **net proceeds (komisyon zaten düşülmüş)**, indirme, iade, **gerçek ödeme** (payout).
- **Auth:** JWT — `.p8` private key + Key ID + Issuer ID (App Store Connect API).
- **API:** `GET /v1/salesReports` (Sales & Trends, günlük/aylık, gzip TSV), `GET /v1/financeReports` (aylık finans). Rate-limit + rapor gecikmesi (~5 gün).
- **Eşleme:** iOS `gross_revenue` (resmi) + `proceeds` (net) + indirme. **Komisyon tahminini öldürür** — gerçek rakam.
- **Not:** "Apple entegrasyonu" buysa: en doğru ama en zor. p8 key yönetimi gerekir.

#### Google Play Console — ❌ · 🟡
- **Verir:** Android resmi finans (satış, vergi, iade, **proceeds**), indirme, abonelik metrikleri.
- **Auth:** Google service account (JSON) — Play Developer API + finans raporları **GCS bucket**'tan (aylık CSV).
- **API:** Play Developer Reporting API; finansal CSV'ler `gs://pubsite_prod_.../earnings/` bucket'ından.
- **Eşleme:** android `gross_revenue` (resmi) + proceeds + indirme.
- **Not:** "Android entegrasyonu". Service account kurulumu + bucket erişimi gerekir.

#### Stripe — ❌ · 🟢
- **Verir:** Web/direkt abonelik + tek seferlik, iade, fee (Stripe komisyonu), payout.
- **Auth:** Secret API key (`sk_...`).
- **API:** `/v1/balance_transactions`, `/v1/charges`, `/v1/subscriptions`, `/v1/payouts`. Webhook ile anlık.
- **Eşleme:** web/stripe `gross_revenue` + net (fee düşülmüş) + payout.

#### Paddle — ❌ · 🟢
- **Verir:** Merchant-of-record satış (Paddle **vergiyi/VAT'ı kendi halleder** → net sana gelir), abonelik.
- **Auth:** API key.
- **API:** Paddle Billing API (`/transactions`, `/subscriptions`) + webhook.
- **Not:** Vergi derdini azaltır (MoR). Web SaaS satışı için iyi.

#### iyzico — ❌ · 🟢
- **Verir:** TR ödeme/abonelik.
- **Auth:** API key + secret.
- **API:** iyzipay REST.

### 3.2 Reklam geliri

#### AdMob — ✅ · 🟡 (orta)
- **Verir:** Tahmini kazanç (gün gün, app×platform), **gösterim**, **eCPM** (hesaplanır).
- **Auth:** Google OAuth (client id/secret + refresh token). **Tek hesap** (account-level) + per-product **app id eşlemesi** (android/iOS).
- **API:** `POST /v1/accounts/{pub}/networkReport:generate` (DATE+APP+PLATFORM, ESTIMATED_EARNINGS + IMPRESSIONS, micros). `localizationSettings.currencyCode` ile para birimi seçilir.
- **Eşleme:** `ad_revenue` + `ad_impressions` (gün gün), takvim-ayı.
- **Eksik (Faz 2):** AdSense Payments → **hesaptaki bakiye** + eşik + ödeme geçmişi (ayrı scope).

#### AppLovin MAX — 🟡 · 🟢
- **Verir:** Reklam geliri (MAX mediation kullanıyorsan), eCPM, gösterim.
- **Auth:** Report key (Management API key).
- **API:** `GET /maxReport` (CSV/JSON, gün+app+platform+network).
- **Durum:** Matris sütunu var (`available:false`), connector/sync **yok**.

#### Unity LevelPlay (ironSource) — ❌ · 🟡
- **Verir:** Mediation reklam geliri/eCPM.
- **Auth:** API key + secret.
- **API:** Reporting API.

#### Meta Audience Network / Liftoff / Mintegral — ❌ · 🟡
- **Verir:** Network bazında reklam geliri (mediation dışı doğrudan kullanıyorsan).
- **Auth:** Network'e göre token/key.

### 3.3 Sağlık / Ops (P&L değil, ürün sağlığı)

#### Sentry — 🟡 · 🟢
- **Verir:** Crash/issue sayısı, crash-free oranı, regression.
- **Auth:** Auth token.
- **API:** `GET /api/0/projects/{org}/{proj}/issues/`, stats.
- **Durum:** Matris sütunu var, connector/sync **yok**. Per-product (her app ayrı Sentry projesi).

#### Firebase Crashlytics — ❌ · 🟡
- **Verir:** Çökme oranı, etkilenen kullanıcı.
- **Auth:** Service account (BigQuery export önerilir).

#### GA4 / Firebase Analytics — ❌ · 🟡
- **Verir:** DAU/MAU, retention, funnel, event.
- **Auth:** Service account (Data API).

### 3.4 Bildirim / Otomasyon

#### Email (Resend) — 🟡 · 🟢
- **Verir:** Aylık P&L raporu (HTML mail).
- **Auth:** API key (`re_...`).
- **Durum:** Kimlik bilgisi UI'da var, **rapor job'u yok** (`lib/report.ts` var; cron + gönderim eksik).

#### Telegram / Slack / Discord / ntfy / Pushover — ❌ · 🟢
- **Verir:** Anlık uyarı: gelir düşüşü, sync hatası, yeni crash, eşik aşımı, aylık özet.
- **Auth:** Webhook URL / bot token. ntfy = sıfır-konfig.

### 3.5 Finans / Muhasebe

#### Komisyon + Vergi — ✅ · —
- Apple/Google IAP komisyon % (platform bazında) + vergi oranı %. Finans drawer'ında. P&L'den düşülür.

#### Banka bakiyesi — ❌ · değişken
- Payout'ların indiği gerçek nakit. Manuel giriş veya open-banking (TR'de zor).

#### Paraşüt / Logo / e-fatura — ❌ · 🟡
- Vergi/muhasebe aktarımı (TR). Gelir → fatura/beyan.

---

## 4. Özet tablo

| Entegrasyon | Kategori | Durum | Auth | Değer |
|---|---|---|---|---|
| RevenueCat | Abonelik | ✅ | 🟢 | ★★★ |
| AdMob | Reklam | ✅ | 🟡 | ★★★ |
| Komisyon+Vergi | Finans | ✅ | — | ★★★ |
| Email/Resend | Bildirim | 🟡 | 🟢 | ★★ |
| AppLovin MAX | Reklam | 🟡 | 🟢 | ★★ |
| Sentry | Ops | 🟡 | 🟢 | ★ |
| Apple App Store Connect | Abonelik/Resmi | ❌ | 🔴 | ★★★ |
| Google Play Console | Abonelik/Resmi | ❌ | 🟡 | ★★★ |
| AdSense Payments (bakiye) | Reklam/Finans | ❌ | 🟡 | ★★ |
| Stripe | Web gelir | ❌ | 🟢 | ★★ (web satışı varsa) |
| Paddle | Web gelir | ❌ | 🟢 | ★★ (MoR) |
| iyzico | TR ödeme | ❌ | 🟢 | ★ |
| Telegram/ntfy bildirim | Otomasyon | ❌ | 🟢 | ★★ |
| Unity LevelPlay | Reklam | ❌ | 🟡 | ★ |
| Crashlytics / GA4 | Ops | ❌ | 🟡 | ★ |
| Paraşüt / e-fatura | Muhasebe | ❌ | 🟡 | ★ |

---

## 5. Önerilen yol haritası (değer ÷ efor)

1. **Yarım işi bitir:** AppLovin MAX + Sentry connector/sync (sütunlar hazır, auth kolay).
2. **Email aylık rapor** job'u (creds hazır, `report.ts` var).
3. **Anlık bildirim** (Telegram/ntfy) — günlük fayda, sıfır-friction.
4. **Web gelir** (varsa): Stripe / Paddle.
5. **Resmi proceeds:** App Store Connect + Play Console — komisyon tahminini gerçek rakamla değiştirir (büyük iş).
6. **AdSense Payments** (hesaptaki bakiye) + **muhasebe** (e-fatura).

---

## 6. Yeni entegrasyon ekleme checklist

1. `connectors/<x>.ts` — API çağrısı + normalize (saf fonksiyon, testlenebilir).
2. `lib/sync-<x>.ts` — kimlik çöz (secret_enc → env fallback), çek, app'e eşle (`external_ids`), **gün gün** `recordSnapshot`.
3. Gerekiyorsa `metric_snapshot`'a additive kolon (hand-written ALTER migration; codegen "create table if not exists" üretir, kullanma).
4. `jobs/sync-<x>.ts` (cron) + `/admin/revenue/sync` manuel tetiğe ekle.
5. UI: per-product ise `INTEGRATIONS[]`'e sütun + drawer body; account-level ise üst buton + `AccountDrawer` kind.
6. Kimlik bilgisi: `/admin/revenue/integrations` (account) veya `/sources` (per-product), AES-GCM ile şifreli.
7. P&L'e katılıyorsa `getOverview`/`getAdBreakdown`'da FX-normalize + takvim-ayı agregasyonu.
8. Doğrula: gerçek veriyle sağlayıcı konsoluyla **birebir** tut (kanıt).
