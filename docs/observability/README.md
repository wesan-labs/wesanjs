# Observability / Analytics

**Hosted vertical analytics** — PostHog (davranış) + GlitchTip (crash). Platform işletir;
tenant anahtar girmez.

## Mimari karar

**[ADR-0003](../adr/0003-hosted-vertical-analytics.md)** — Kabul (2026-07-06)

```
PostHog + GlitchTip (platform OSS)     MOTOR
@medusajs/analytics                    ENGINE   snapshot, bootstrap, sync
analytics-plugin                       SHELL    HTTP + /analytics UI
```

ADR-0002 BYOK matris modeli **superseded**.

## Dokümanlar

| Doc | Rol |
|-----|-----|
| [ADR-0003](../adr/0003-hosted-vertical-analytics.md) | **Geçerli** mimari karar |
| [Vertical analytics rehberi](./vertical-analytics.md) | Kullanım, vertical pack, tenant izolasyonu |
| [Analytics engine](../architecture/modules/custom/analytics.md) | Modül spec |
| [Analytics plugin](../architecture/plugins/observability.md) | Kabuk spec |
| [Task #0010](../tasks/0010-observability-plugin.md) | Uygulama checklist |
| [light-analytics-integration.md](./light-analytics-integration.md) | ~~BYOK rehberi~~ deprecated |

## Sonraki adım

Faz 1 — PostHog/GlitchTip infra + `analytics_metric_snapshot` + bootstrap API (task #0010).
