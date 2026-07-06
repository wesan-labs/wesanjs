# Kontrol Düzlemi (Control Plane)

Platform omurgası — feature plugin'lerden ve commerce modüllerinden **ayrı** düşünülür.
Her tenant-scoped veri bu katmandan geçer.

## Katmanlar

```
┌─ KONTROL DÜZLEMİ ─────────────────────────────────────┐
│  Tenant (kimlik + üyelik + scope)                      │
│  RBAC (per-tenant yetki)                               │
│  Entitlement (plan + modül mağazası)        [planned]  │
│  Billing / Subscription lifecycle           [planned]  │
└────────────────────────────────────────────────────────┘
         │ tenant_id + RLS her isteği keser
         ▼
┌─ FEATURE PLUGIN'LER ──────────────────────────────────┐
│  cms · revenue · content · loyalty · mail              │
└────────────────────────────────────────────────────────┘
         ▼
┌─ COMMERCE (Medusa) ───────────────────────────────────┐
│  product · order · customer · payment · …              │
└────────────────────────────────────────────────────────┘
```

## Bileşenler

| Bileşen | Paket | Durum | Sorumluluk |
|---------|-------|-------|------------|
| Tenant + Membership | `@medusajs/tenant-plugin` | 🟡 A1–A2 bitti | Org entity, üyelik, `x-tenant-id` middleware, CMS + content + revenue RLS |
| RBAC | `@medusajs/rbac` | 🟡 Per-tenant MVP | Rol/policy; tenant membership `rbac_role_id` + `x-tenant-id` scope |
| Entitlement | — | 🔮 | `hasFeature(tenant, key)`, plan matrisi, `<FeatureGate>` |
| Billing | revenue plugin üstü | 🔮 | Subscription lifecycle, dunning |

## Admin UI konumu

| Kavram | Nerede | Route |
|--------|--------|-------|
| Aktif org seçimi | Header workspace dropdown | — |
| Org profili | Settings | `/settings/organization` |
| Takım üyeleri | Settings | `/settings/organization/members` |
| Roller / policy | Settings | `/settings/roles`, `/settings/policies` |
| Plan / faturalama | Settings | `/settings/billing` (planned) |

**Kaldırıldı:** `/tenants` sidebar linki — tenant bir feature modülü değil.

## İstek akışı

```
Admin isteği
  → auth (actor_id)
  → x-tenant-id header (opsiyonel; legacy modda yok)
  → membership doğrulama → 403
  → req.tenant_id set
  → app-layer query scope + Postgres RLS (defense-in-depth)
  → RBAC policy check (tenant-scoped roles when x-tenant-id set; #0007)
```

## RBAC etkinleştirme (A3 — dikkatli)

1. `MEDUSA_FF_RBAC=true` helm `.env`'e ekle
2. `medusa-config.js`: `featureFlags.rbac` + `modules[RBAC]` (`@medusajs/rbac` dependency gerekli)
3. Boot + migrate — RBAC tabloları oluşur; `create-super-admin-role` mevcut admin'lere `role_super_admin` atar
4. Dashboard feature flag `rbac` otomatik açılır → `/admin/rbac/me/permissions` çalışır
5. **İlk enforced vertical:** revenue (`revenue:read` pano, `expense:create/delete` gider)
6. Finance: `membership.rbac_role_id = role_finance` (org başına; global link değil). Çözümleme kuralları → [#0007](../tasks/0007-per-tenant-rbac.md)

**Not:** Script RBAC modülünden önce çalışırsa no-op olur. `script_migrations`'dan `create-super-admin-role.js` satırını silip `medusa db:migrate:scripts` tekrar çalıştır.

Flag kapalıyken tüm policy check'ler no-op (mevcut davranış korunur).

## İlgili

- [Levios platform mimarisi](levios-platform-architecture.md) — ana mühendislik dokümanı
- [Onboarding — control plane](../onboarding/control-plane-onboarding.md)
- [ADR-0001 — Multi-tenancy](../adr/0001-multi-tenancy.md)
- [tenant plugin](plugins/tenant.md)
- [tasks/0004](../tasks/0004-tenant-foundation.md) · [0005](../tasks/0005-tenant-id-rls-rollout.md) · [0007](../tasks/0007-per-tenant-rbac.md)
- [SaaS iş dökümü](../research/2026-07-01-saas-atolye-detayli-is-dokumu.md) — Track A
