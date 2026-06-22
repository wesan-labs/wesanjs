# app-analytics — App-Centric Revenue Spec (v0)

> Revenue'yu "düz toplam"dan **app-merkezli** modele taşır: her ürün × platform × kaynak-tipi ayrı, üstte roll-up.
> Kardeş: [REVENUE-SPEC.md]. Mevcut revenue plugin'i genişletir (yeni plugin değil).

## 1. Onaylı yapı (kanıt: canlı probe + AdMob ekranı)
- **Ürün** = oyun/uygulama (Empire Inc., Block Forge…). Her biri **ayrı RevenueCat projesi** (kendi key+project_id) → abonelik geliri.
- **Platform** = iOS (App Store) / Android (Play Store). RC `charts/revenue?segment=store` platformu ayırır ✓.
- **Reklam** = **TEK AdMob hesabı**. `networkReport` (boyut: APP + PLATFORM + DATE) tüm ürün×platformu verir ✓. Para birimi **TRY**.
- Çok para: abonelik USD, reklam TRY → tek raporlama birimine FX (mevcut `lib/fx.ts`).

## 2. Model — 3 eksen: app × platform × source_type
- **`app`** (ürün defteri): `id, name, status, icon_url?, external_ids(jsonb: { revenuecat_project_id, admob_app_ids:[], app_store_id?, play_store_id? }), metadata`.
- **`revenue_source`** (rework): `+app_id (nullable — RC için dolu/1:1; AdMob için null=hesap-seviyesi çok-app), +external_id (RC project id / AdMob publisher id)`. Sır `credentials_ref` (.env/secrets).
- **`metric_snapshot`** (granüler rework): `+platform('ios'|'android'|'web'|'all')`. **UNIQUE(date, app_id, platform, source_type)**. Kolonlar zaten var: mrr, gross_revenue, **ad_revenue**, active_subscriptions, active_trials, new_customers, active_users.
- **`revenue_event`**: `+platform`. **`expense`**: `app_id` (app'e atfedilebilir gider) + null=genel.
- Roll-up: (app+platform+source) → app toplamı → GENEL. Drill aşağı, topla yukarı.

## 3. Kaynak yönetimi — Ayarlar → Bağlantılar
Çok app = çok key → `.env` değil. Her ürün eklenir + RC key/project_id yapıştırılır; AdMob **tek hesap** bir kez (OAuth). `app.external_ids` ile AdMob rapor satırı → app eşlenir (önce isim, sonra id).

## 4. Sync
- **RC (her ürün projesi):** overview + `charts/revenue?segment=store` → (app, platform) abonelik snapshot'ları.
- **AdMob (tek hesap):** `networkReport` APP+PLATFORM+DATE → satırları `external_ids`/isimle app'e eşle → (app, platform) `ad_revenue` snapshot'ları.
- Hepsi `metric_snapshot(date, app_id, platform, source_type)`'a upsert (idempotent).

## 5. UI
- **Apps listesi:** her ürün — toplam gelir (abonelik+reklam) · net · platformlar · küçük trend.
- **App detay:** platform kırılımı (iOS/Android) · kaynak kırılımı (abonelik vs reklam) · trend · ülke.
- **Genel:** tüm app'ler toplamı (mevcut revenue paneli buna döner) + en iyi/kötü app.

## 6. Fazlar
- **Faz 1:** `app` model + `revenue_source`/`metric_snapshot` rework + migration + Ayarlar→Bağlantılar (app+RC key ekle).
- **Faz 2:** per-app/platform sync (RC segment=store; sonra AdMob app+platform). FX TRY/USD→raporlama.
- **Faz 3:** Apps listesi + app detay + genel toplam UI.

## 7. Açık kararlar
- **AdMob OAuth:** basit key yok; Google OAuth (consent→refresh token) gerek — Faz 2'de Can creds verince canlı.
- **App↔AdMob eşleme:** önce isim eşleşmesi ("Empire Inc."), sonra `external_ids.admob` ile sağlamlaştır.
- **Raporlama birimi:** store default (mevcut `Money`/FX ile aynı).
