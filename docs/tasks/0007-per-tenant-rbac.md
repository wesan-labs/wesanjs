# #0007 — Per-tenant RBAC (Medusa rbac wire)

| | |
|---|---|
| **Durum** | 🟡 Temel wire tamam — UI atama + varsayılan roller bekliyor |
| **Öncelik** | Orta-Yüksek |
| **Etiketler** | multi-tenant · rbac · auth |
| **Bağımlı** | #0004 |
| **Karar** | ADR-0001 |

## Amaç

Per-tenant modül rolleri. Medusa `@medusajs/rbac` + `TenantMembership.rbac_role_id` ile org başına atama.

## Tamamlanan (dikkatli MVP)

- [x] `tenant_membership.rbac_role_id` kolonu + migration
- [x] Çözümleme kuralları dokümante (`control-plane.md` tablo)
- [x] `resolveTenantRbacRoleIds` + unit test dosyası
- [x] Framework: `check-permissions`, `me/permissions`, field filter → tenant-scoped
- [x] `PATCH /admin/tenants/:id/members/:membershipId` (role + rbac_role_id)
- [x] Finance pilot: global rol kaldırıldı, Acme membership'e taşındı
- [x] `verify-onboarding-pilot` per-tenant assert'leri

## Bekleyen (bilinçli olarak sonraya)

- [ ] Dashboard: üye satırında modül rolü göster + düzenle
- [ ] Varsayılan tenant rolleri seed (admin → tenant-admin template)
- [ ] Content/social policy taksonomisi + sosyal-uzman rolü
- [ ] ABAC (Cerbos/OPA) — yalnız gerekirse

## Çözümleme kuralları

`x-tenant-id` varken:

1. `role_super_admin` (global) → platform bypass
2. `rbac_role_id` → o rol
3. `membership.role === admin` → global modül rolleri inherit
4. Diğer → `[]`

## Bitti sayılır

- [x] Finance: Acme'de revenue, Beta'da modül izni yok (verify script)
- [ ] UI'dan `rbac_role_id` atanabiliyor
- [ ] Sosyal-uzman şablonu revenue'ya 403 veriyor
- [ ] Dokümante edilmiş operatör runbook

## Dosyalar

- `packages/plugins/tenant/src/api/lib/resolve-tenant-rbac-roles.ts`
- `packages/core/framework/src/http/utils/resolve-effective-rbac-roles.ts`
- `packages/medusa/src/migration-scripts/wire-per-tenant-rbac.ts`
