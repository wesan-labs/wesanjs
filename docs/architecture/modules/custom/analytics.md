# analytics — Hosted vertical analytics engine   🟡 ADR-0003

## Ne yapar

Tenant-scoped **hosted analytics** engine: ürün registry, bootstrap token, PostHog/GlitchTip
provisioning, günlük metric snapshot sync ve `track`/`identify` relay.

**Karar:** [ADR-0003](../../adr/0003-hosted-vertical-analytics.md) — PostHog (davranış) +
GlitchTip (crash). BYOK matrisi MVP'de yok.

## Tür & katman

| | |
|---|---|
| **Tür** | infrastructure module (`@medusajs/analytics`) |
| **Katman** | servis + persistence + OSS motor client'ları |
| **tenant_id** | Evet — RLS |
| **Admin UI** | Analytics plugin kabuğu + dashboard `/analytics` |

## Bugün vs hedef (ADR-0003)

| | Bugün | Hedef |
|---|-------|-------|
| Persistence | Yok | `analytics_metric_snapshot`, `analytics_bootstrap_token` |
| Provider | Tek global PostHog relay | Tenant-aware PostHog + GlitchTip routing |
| tenant_id | Yok | RLS + scope filter |
| Provisioning | Yok | Tenant → PH project; product → PH group |
| Bootstrap | Yok | Token → SDK config API |
| Panel grafikleri | Yok | Snapshot + PostHog API özet |

## Mimari / katmanlar

| Katman | Bugün | Hedef |
|--------|-------|-------|
| models | ❌ | snapshot, bootstrap_token |
| services | ✅ relay only | + ProductService, BootstrapService, SnapshotSync |
| providers | PostHog, Local | PostHog tenant-aware; GlitchTip DSN provision |
| jobs | ❌ | daily PostHog/GlitchTip sync |
| api | ❌ | Analytics plugin'de |

## Veri modeli

### analytics_metric_snapshot

Revenue `metric_snapshot` pattern — panel grafikleri.

| Alan | Tip | Açıklama |
|------|-----|----------|
| tenant_id | text | RLS |
| product_id | text | RevApp id |
| date | date | UTC gün |
| source | enum | `posthog` \| `glitchtip` \| `gameanalytics` |
| metric | text | `dau`, `crash_count`, `funnel_step_*`, … |
| value | numeric | |
| dimensions | jsonb | platform, version |

### analytics_bootstrap_token

| Alan | Tip |
|------|-----|
| tenant_id, product_id | text |
| token_hash | text |

### Ürün kaynağı (Faz 1)

Revenue `RevApp` + yeni alanlar: `vertical` (`mobile_game` \| `mobile_app` \| `web`),
`runtime` (`unity` \| `godot` \| `expo` \| `nextjs` \| …).

## Vertical pack (Wesan katmanı — config, fork değil)

| Vertical | PostHog events | Dashboard |
|----------|----------------|-----------|
| mobile_game | level_*, session_*, ad_*, iap_* | D1/D7, level drop-off |
| mobile_app | onboarding_*, subscribe_* | Onboarding hunisi |
| web | pageview, cta_*, signup | Conversion hunisi |

## Provider stratejisi

```
Platform infra:
  PostHog self-host (MIT) — tenant = project, product = group
  GlitchTip self-host (MIT) — tenant = org, product = project

medusa-config:
  providers: [{ resolve: "@medusajs/analytics-posthog", … platform PH }]

AnalyticsService.track(event, { tenant_id, product_id }):
  → resolve tenant PostHog project key
  → capture with groups: { product: product_id }
```

## Public yüzey (hedef)

| Method | Açıklama |
|--------|----------|
| `listProducts(tenantId)` | RevApp + vertical |
| `provisionProduct(...)` | PH group + GlitchTip project |
| `getBootstrapConfig(token)` | SDK init JSON |
| `rotateBootstrapToken(productId)` | |
| `syncSnapshots(tenantId?)` | Job entry |
| `track` / `identify` | Mevcut — tenant context eklenir |

## Bağımlılıklar & linkler

- [ADR-0003](../../adr/0003-hosted-vertical-analytics.md)
- [observability plugin](../plugins/observability.md)
- [vertical-analytics.md](../../observability/vertical-analytics.md)
- Revenue snapshot: `packages/plugins/revenue/src/modules/revenue/models/metric-snapshot.ts`

## Durum

- **Yapılan:** PostHog + Local provider relay, track/identify API
- **Yapılacak:** ADR-0003 engine (snapshot, bootstrap, sync, tenant-aware PH)
- **Kaldırılacak:** ADR-0002 BYOK `AnalyticsConnection` matris modeli (enterprise Faz 5)

## Kanıt yolları

- `packages/modules/analytics/src/services/`
- `packages/modules/providers/analytics-posthog/`
