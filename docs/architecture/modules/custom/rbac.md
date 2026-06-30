# rbac — Rol-bazlı erişim kontrolü (rol/policy/hiyerarşi)   [✅ Çalışır]

## Ne yapar
Rol-bazlı erişim kontrolü (RBAC) sağlar: roller, policy'ler (resource:operation) ve rol hiyerarşisi (inheritance) tanımlar. Kayıtlı policy'leri uygulama başlangıcında otomatik senkronize eder ve rol hiyerarşisinde sonsuz döngüyü (cycle) engeller.

## Tür & katman
Custom modül; vanilla Medusa'da YOK. Per-tenant RBAC katmanı olarak çalışır.

## Mimari / katmanlar

| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 4 model (RbacRole, RbacPolicy, RbacRolePolicy, RbacRoleParent) |
| services | ✅ | 6 service metodu (@InjectManager / @InjectTransactionManager) |
| repositories | ✅ | Custom query (cycle-detection, N+1 önleme) |
| loaders | ✅ | Policy sync — onApplicationStart |
| migrations | ✅ | 1 migration (Migration20251219163509.ts) |
| api | 🔴 | YOK |
| admin | 🔴 | YOK |

## Veri modeli
- **RbacRole** — `name`, `description`, `metadata`; hasMany policies / parents.
- **RbacPolicy** — `key` (= `resource:operation`), `name`, `resource`, `operation`.
- **RbacRolePolicy** — join (rol ↔ policy).
- **RbacRoleParent** — rol hiyerarşisi / inheritance.

## Public yüzey
- `listPoliciesForRole(roleId)`
- `listRbacRoles`
- `listAndCountRbacRoles`
- `createRbacRoleParents`
- `updateRbacRoleParents`
- `syncRegisteredPolicies` (private, onApplicationStart)

## Bağımlılıklar & linkler
- Tenant plugin ile çift çalışır (per-tenant RBAC).

## Durum
- **Yapılan:** 4 entity + relation, `@InjectManager` / `@InjectTransactionManager`, cycle-detection (hiyerarşide sonsuz döngü engeli), policy sync (mevcut vs registered — soft-delete / restore), repository custom query.
- **Yapılmayan/eksik:** API route yok; **enforcement middleware yok** (route-level policy check) — asıl değer burada; admin UI yok; audit log yok.
- **Yapılacak (sıralı):**
  1. API (admin roles / policies CRUD)
  2. Enforcement middleware
  3. Admin (role manager, policy grid, inheritance visualizer)
  4. Audit log

## Hizmet ettiği dikeyler
HEPSİ (per-tenant RBAC). Tenant plugin ile çift çalışır.

## Kanıt yolları
- `packages/modules/rbac/src` (models, services, repositories)
- `packages/modules/rbac/src/migrations/Migration20251219163509.ts`
