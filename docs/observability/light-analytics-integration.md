# Observability — Entegrasyon Rehberi

> **Deprecated (2026-07-06):** BYOK matris modeli [ADR-0003](../adr/0003-hosted-vertical-analytics.md)
> ile değiştirildi. Güncel rehber: [vertical-analytics.md](./vertical-analytics.md)

> **Eski ADR:** [0002-analytics-engine-observability-shell.md](../adr/0002-analytics-engine-observability-shell.md) (BYOK kısmı geçersiz)

---

## 1. Nasıl çalışır?

```
Müşteri (tenant)
  └─ wesan panel → Ayarlar → Entegrasyonlar
       ├─ Ürün ekle (oyun, app, web sitesi)
       └─ Matris hücresine tıkla → Sentry / Aptabase / … anahtarını gir
            ↓
       wesan DB (tenant_id + şifreli secret)
            ↓
       Müşterinin uygulaması → bootstrap API → SDK init → kendi dashboard'unda görür
```

wesan **veriyi saklamaz ve göstermez** — sadece bağlantı broker'ıdır.

---

## 2. Örnek: 9 ürünlü tenant

```
Empire Inc. (tenant)
├── Oyun 1–4     → Crashlytics + GameAnalytics (+ Sentry opsiyonel)
├── Mobil App    → Crashlytics + Aptabase
└── Web 1–4      → Sentry + Aptabase
```

| Ürün | Errors | Usage | Oyun metrikleri |
|------|--------|-------|-----------------|
| Mobil oyun (×4) | Crashlytics (free, sınırsız) | Aptabase (opsiyonel) | GameAnalytics (free) |
| Mobil app (×1) | Crashlytics | Aptabase | — |
| Web (×4) | Sentry (5K error/ay free) | Aptabase veya PostHog | — |

**Aptabase 9 app:** Free tier 1 app → tenant **Pro ($29/ay)** veya **self-host** gerekir.

---

## 3. Provider detayları

### Aptabase — usage (ne kullanılıyor?)

| Verir | Vermez |
|-------|--------|
| Custom event sayıları | Crash / stack trace |
| Session timeline, live view | Gerçek MAU / retention cohort |
| OS, app version kırılımı | Funnel, A/B test |
| CSV export | Oyun economy |

| Plan | Fiyat | App | Event/ay |
|------|-------|-----|----------|
| Free | $0 | 1 | 20K |
| Hobby | $14 | 3 | 100K |
| Pro | $29 | 10 | 1M |
| Self-host | $0 (+ VPS) | ∞ | ∞ |

SDK: Web, Expo, Electron, Tauri, Unity, Godot, Unreal.

### Sentry — errors (nerede kırılıyor?)

| Verir | Vermez |
|-------|--------|
| Stack trace, breadcrumbs | Usage analytics |
| Release health, crash-free % | — |
| Web + mobil + desktop + Unity + Godot | — |

Free: 5K error/ay. 9 ürün = 9 ayrı proje/DSN.

### Firebase Crashlytics — mobil/oyun errors

| Verir | Vermez |
|-------|--------|
| Sınırsız crash (mobil) | Web, desktop |
| ANR, release health | — |
| Unity native desteği | — |

**Mobil oyunlar için Sentry free yerine Crashlytics tercih edilir.**

### GameAnalytics — oyun metrikleri

| Verir | Vermez |
|-------|--------|
| Level completion, churn at level | Web crash |
| DAU, retention, economy | — |
| Unity, Godot SDK | — |

Free indie tier.

### PostHog — ileri usage (opsiyonel sütun)

Funnel, retention, feature flags, session replay. Free 1M event/ay.

---

## 4. Matris sütunları (plan)

| Sütun | Kategori | Tenant girer | Ücretsiz? |
|-------|----------|--------------|-----------|
| Sentry | errors | DSN | 5K error/ay |
| Crashlytics | errors | Firebase config | Sınırsız (mobil) |
| Aptabase | usage | App Key | 20K/1 app |
| PostHog | usage | Project API Key | 1M event/ay |
| GameAnalytics | game_metrics | Game Key + Secret | Free indie |

Revenue sütunları (RevenueCat, AdMob) aynı matriste kalır — farklı plugin, aynı UI.

---

## 5. Event contract (müşteri uygulamaları)

Tüm platformlarda aynı isimler:

| Event | Ne zaman |
|-------|----------|
| `app_started` | Cold start |
| `screen_view` | Ekran / route değişimi |
| `feature_used` | Kritik aksiyon |
| `level_completed` | Oyun level bitişi |

Kurallar: `snake_case`, PII yok, string/number property.

---

## 6. Bootstrap akışı (müşteri geliştiricisi)

```typescript
// 1. Uygulama açılışında — anahtar build'de YOK
const config = await fetch(
  "https://api.wesan.io/observability/v1/products/{productId}/config",
  { headers: { Authorization: `Bearer ${BOOTSTRAP_TOKEN}` } }
).then(r => r.json())

// 2. SDK init
if (config.providers.sentry) {
  Sentry.init({ dsn: config.providers.sentry.dsn })
}
if (config.providers.aptabase) {
  init(config.providers.aptabase.app_key)
}

// 3. Event
trackEvent("app_started", { platform: "unity" })
```

Bootstrap token panelden üretilir (ürün başına rotate edilebilir).

---

## 7. 1000 tenant platformu

| | wesan | Tenant |
|--|-------|--------|
| Provider faturası | $0 | Kendi planı |
| Veri | Sadece encrypted secrets | Kendi Sentry/Aptabase dashboard |
| Kota yönetimi | Yok | Tenant kendi dashboard'unda |
| Sorumluluk | RLS, secret güvenliği, bootstrap API | Provider hesabı, plan yükseltme |

---

## 8. Bilinçli kısıtlar

| Yapma | Neden |
|-------|-------|
| Global `.env` key | Tenant BYOK ile çelişir |
| Platform tek analytics hesabı | İzolasyon yok |
| Aptabase tek başına | Crash vermez; oyun metrikleri zayıf |
| Veriyi wesan'e çekmek (Faz 1) | Broker model — scope creep |

---

## 9. Uygulama fazları

Detaylı checklist: [tasks/0010-observability-plugin.md](../tasks/0010-observability-plugin.md)

**ADR-0002 sıralaması:**

| Faz | Paket | İçerik |
|-----|-------|--------|
| A | `@medusajs/analytics` | Modeller, ConnectionService, DynamicProvider |
| B | `observability-plugin` | Admin API, bootstrap endpoint |
| C | `admin/dashboard` | Matris sütunları + **`/analytics` sayfası** |
| D | Her ikisi | Crashlytics, GameAnalytics sütunları |
| E | Docs | Client bootstrap snippet'leri |

---

*Son güncelleme: 2026-07-03*
