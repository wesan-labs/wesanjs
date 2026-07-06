# Vertical Analytics — Hosted model (ADR-0003)

> **Karar:** [ADR-0003](../adr/0003-hosted-vertical-analytics.md)  
> **Eski BYOK rehberi:** [light-analytics-integration.md](./light-analytics-integration.md) (deprecated)

---

## 1. Nasıl çalışır?

```
Tenant (stüdyo / müşteri)
  └─ Panel → Ürün ekle (isim + tip: oyun / app / web)
       ↓
  Wesan otomatik: PostHog project (tenant) + group (ürün) + GlitchTip project
       ↓
  Uygulama → bootstrap token → SDK init → event/crash platform motorlarına
       ↓
  Günlük sync → analytics_metric_snapshot → /analytics dashboard
```

**Tenant anahtar girmez.** Platform PostHog + GlitchTip işletir.

---

## 2. Örnek: senin stüdyon (1 tenant, 5 ürün)

```
Wesan Studio (tenant)
├── Empire Puzzle      → vertical: mobile_game
├── Word Rush          → vertical: mobile_game
├── SaaS App           → vertical: mobile_app
├── Landing v1         → vertical: web
└── Blog               → vertical: web
```

| Ürün | PostHog | GlitchTip | Panelde |
|------|---------|-----------|---------|
| Oyun | level_*, session_*, ad_* events | crash, stack | Retention D1/D7, level drop-off |
| App | onboarding_*, subscribe_* | crash | Onboarding hunisi + RC gelir kartı |
| Web | pageview, cta_*, signup | JS errors | Sayfa hunisi, UTM |

Hepsi **aynı tenant**, `/analytics` dropdown ile ürün değiştir.

---

## 3. Başka müşteri (tenant izolasyonu)

```
Müşteri X (tenant)     → PostHog project: tenant_musteri_x
Müşteri Y (tenant)     → PostHog project: tenant_musteri_y
Wesan Studio (tenant)  → PostHog project: tenant_wesan
```

- API: `x-tenant-id` — üye değilsen 403
- DB: `tenant_id` + RLS
- PostHog: project API key tenant row'da; cross-tenant query yok

---

## 4. Vertical pack — hazır event'ler

### mobile_game

| Event | Açıklama |
|-------|----------|
| `session_start` | Oturum |
| `level_start` / `level_complete` / `level_fail` | Progression |
| `ad_impression` / `ad_reward` | Reklam |
| `iap_purchase` | IAP |

Dashboard: D1/D7 retention, level 5 drop-off, günlük oturum.

### mobile_app

| Event | Açıklama |
|-------|----------|
| `install` → `signup` → `first_action` → `subscribe` | Onboarding hunisi |

Dashboard: huni + RevenueCat MRR (Revenue entegrasyonu).

### web

| Event | Açıklama |
|-------|----------|
| `$pageview`, `cta_click`, `signup_complete` | Conversion |

Dashboard: landing → CTA → signup hunisi; referrer kırılımı.

---

## 5. SDK bootstrap (plan)

```http
GET /analytics/v1/config
Authorization: Bearer {bootstrap_token}
```

Yanıt (örnek):

```json
{
  "product_id": "rapp_…",
  "vertical": "mobile_game",
  "posthog": { "host": "https://ph.wesan.internal", "project_key": "phc_…" },
  "glitchtip": { "dsn": "https://…@glitchtip.wesan.internal/…" }
}
```

Uygulama `.env` okumaz — token panelden kopyalanır.

---

## 6. Motorlar — ne ne işe yarar?

| Motor | Verir | Vermez |
|-------|-------|--------|
| **PostHog** | Huni, retention, cohort, event trend, replay, flags | Native crash (mobil oyun derinliği) |
| **GlitchTip** | Crash, stack trace, release health | Huni, DAU |
| **GameAnalytics** (Faz 3, opsiyonel) | Oyun economy, progression API | Self-host |

Detaylı karşılaştırma: [vertical-analytics.md](./vertical-analytics.md) §6

---

## 7. BYOK ne oldu?

ADR-0002'deki Entegrasyonlar matrisi (Sentry DSN, Aptabase key) **varsayılan akış değil**.
Enterprise müşteri kendi PostHog instance'ını bağlamak isterse Faz 4+ — normal stüdyo /
müşteri için gerekmez.

Geçici kod: `packages/plugins/revenue/src/api/admin/observability/*` — kaldırılacak.

---

## 8. Infra (platform ekibi)

| Servis | Deploy | Not |
|--------|--------|-----|
| PostHog | Docker Compose / K8s | [posthog.com/docs/self-host](https://posthog.com/docs/self-host) |
| GlitchTip | Docker Compose | ~512 MB RAM |

MVP alternatif: PostHog Cloud free tier + GlitchTip self-host — sonra migrate.

---

## Kaynakça

- [PostHog GitHub (MIT)](https://github.com/PostHog/posthog)
- [GlitchTip backend (MIT)](https://gitlab.com/glitchtip/glitchtip-backend)
- [OpenPanel — alternatif değerlendirme](https://github.com/Openpanel-dev/openpanel)
- [GlitchTip vs Sentry self-host](https://ossalt.com/guides/glitchtip-vs-sentry-community-2026)
