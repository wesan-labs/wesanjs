# observability / analytics — HTTP + Admin UI kabuğu (ADR-0003)   🔴 Planlandı

## Ne yapar

**Hosted vertical analytics** kabuğu: admin API, `/analytics` dashboard, bootstrap endpoint.
İş mantığı `Modules.ANALYTICS` engine'ine delege edilir.

**Karar:** [ADR-0003](../../adr/0003-hosted-vertical-analytics.md)

```
analytics-plugin (veya observability-plugin)  →  HTTP + UI only
@medusajs/analytics                           →  snapshot, bootstrap, sync, PH/GT client
PostHog + GlitchTip                           →  platform OSS motorları
```

## Tür & katman

| | |
|---|---|
| **Paket** | `@medusajs/analytics-plugin` (planlanan; geçici ad: observability) |
| **Katman** | feature plugin — kabuk |
| **Engine** | `@medusajs/analytics` |
| **tenant_id** | Engine + `tenantScopeFilter` |

## Bu plugin'de NE var / NE yok

| Var (kabuk) | Yok (engine / infra) |
|-------------|----------------------|
| Admin API routes | PostHog/GlitchTip docker deploy |
| Bootstrap public endpoint | Snapshot sync logic |
| `/analytics` vertical dashboards | PostHog/GlitchTip provisioning impl |
| Ürün ekle (vertical seç) | BYOK matris drawer'ları |

## Admin API (plan — ADR-0003)

| Method | Path | Engine |
|--------|------|--------|
| GET | `/admin/analytics/products` | `listProducts` |
| POST | `/admin/analytics/products` | `createProduct` + provision |
| GET | `/admin/analytics/overview` | snapshot + live summary |
| GET | `/admin/analytics/products/:id/funnel` | vertical funnel |
| POST | `/admin/analytics/products/:id/bootstrap/rotate` | `rotateBootstrapToken` |
| GET | `/analytics/v1/config` | `getBootstrapConfig` (public, token) |

## Admin UI (plan)

### `/analytics` — ana ekran

- Ürün dropdown (aynı tenant'taki 4–5 proje)
- Vertical şablon: oyun / app / web
- Kartlar: DAU, event trend, huni özeti, crash-free %, son hatalar sayısı
- Bootstrap token + SDK snippet (Unity, Expo, Next.js)
- Revenue ile aynı ürün adları (RevApp)

### Entegrasyonlar matrisi

**Analytics sütunları yok** (ADR-0003). Sadece Revenue: RevenueCat, AdMob, …

## Revenue ile ilişki

| | revenue | analytics kabuğu |
|---|---------|------------------|
| Ürün satırı | `RevApp` | **Aynı** RevApp + `vertical` alanı |
| UI | Entegrasyonlar (gelir) | `/analytics` (kullanım + crash) |
| Snapshot | `revenue_metric_snapshot` | `analytics_metric_snapshot` |

## Durum

- **Yapılan:** ADR-0003, vertical-analytics rehberi, `/analytics` iskelet UI
- **Geçici (silinecek):** BYOK Sentry/Aptabase matris + `revenue/observability` bridge
- **Yapılacak:** [0010-observability-plugin.md](../../tasks/0010-observability-plugin.md)

## İlgili dokümanlar

- [ADR-0003](../../adr/0003-hosted-vertical-analytics.md)
- [analytics.md](../modules/custom/analytics.md)
- [vertical-analytics.md](../../observability/vertical-analytics.md)
- [revenue.md](./revenue.md)

## Kanıt yolları

- `packages/admin/dashboard/src/routes/analytics/index.tsx`
- `packages/plugins/revenue/src/api/admin/observability/` — **deprecated, silinecek**
