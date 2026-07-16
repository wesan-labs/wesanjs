# #0014 — Güvenlik temeli: RLS'i uyandır + RBAC route policy'leri

| | |
|---|---|
| **Durum** | 🟢 Hazır (ADR-0004 A1 — kuyrukta ilk sıra) |
| **Öncelik** | Yüksek |
| **Etiketler** | security · multi-tenant · rbac |
| **Bağımlı** | — (paralel çalışılabilir; #0008 şablon kaynağı) |
| **Karar** | ADR-0001 (defense-in-depth) · ADR-0004 (A1) |

## Amaç
İzolasyonu tek katmandan (app-layer, çalışıyor) iki katmana çıkar: **uyuyan RLS'i
aktive et** ve **kozmetik RBAC'i kritik route'larda gerçek guard'a** çevir.
Durum tespiti: [identity-and-tenancy.md](../architecture/identity-and-tenancy.md) §4-5.

## Kapsam
- [x] `levios_app` rolüyle RLS doğrulama script'i — `packages/plugins/tenant/scripts/verify-rls.mjs`.
      **2026-07-16 canlı helm DB'de 19/19 geçti:** katalog (10 tablo RLS+policy ✓), rol hijyeni
      (BYPASSRLS yok ✓), davranış (strict deny / scope / WITH CHECK reddi / SET LOCAL semantiği ✓)
- [x] Tenant yönetim mutasyonlarına RBAC `policies` deklarasyonu — sözleşme `export const policies`
      DEĞİL, **middlewares.ts `MiddlewareRoute.policies`** çıktı (customers şablonu). Tenant plugin:
      create/update tenant + add/update/remove member policy'li; policy kataloğu
      `plugins/tenant/src/policies/tenant.ts` (policiesLoader plugin taramasıyla auto-sync)
- [x] `tenant_id` index kontrolü — tüm RLS tablolarında müstakil tenant_id index'i var ✓;
      bazı composite'ler tenant-leading değil (revenue_event) → perf notu, güvenlik açığı değil
- [ ] ~~Middleware'e `set_config`~~ → **DÜZELTİLDİ (kanıt sonrası):** her modülün kendi MikroORM
      pool'u var; middleware'den tek `set_config` module pool'larına ulaşmaz (tiyatro olur).
      Old-levios da bunu HİÇ yapmamış (izolasyonu MikroORM filter'ları taşıyordu, RLS uykuda
      sigortaydı). Gerçek seçenekler (ayrı karar): (a) per-transaction SET LOCAL framework hook'u,
      (b) prod'da `levios_app` + workflow-level `withTenant` sarmalayıcı. → **slice 2**
- [ ] Arka plan job/cron tenant context'i (ADR-0001 gotcha #2) — set_config kararına bağlı, slice 2
- [ ] `MEDUSA_FF_RBAC` açılış planı — policy envanteri: core (customers/order/product/… hazır) +
      tenant (bu task ✓); açılış #0008 rol-seed'iyle birlikte

## Script bulguları (2026-07-16)
- ⚠ `product_3d_asset` ve `tenant_membership`: tenant_id'li ama **RLS'siz** → #0005 kapsamına
- ℹ FORCE RLS hiçbir tabloda yok — runtime rolü owner olmadığı sürece sorun değil (dev'de owner=postgres superuser zaten bypass)

## Bitti sayılır
- [x] `levios_app` rolüyle çapraz-tenant SELECT **boş** dönüyor (script kanıtı: var unset → 0 satır; var=A → B görünmez; çapraz INSERT reddi)
- [ ] Flag açıkken policy'siz kullanıcı kritik route'ta **403** (flag açılışı #0008 rol-seed bekliyor)
- [x] Dev runtime (superuser) davranışı değişmedi (policies flag-gated; tsc ✓)
