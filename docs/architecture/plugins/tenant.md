# tenant — Multi-tenant omurga (Tenant + TenantMembership)   🟡 Kısmi

## Ne yapar
Tenant (müşteri org) + TenantMembership (kullanıcı-tenant-rol). Tüm domain tabloları `tenant_id` taşıyacak, RLS izolasyon hedefi.

## Tür & katman
- **Paket türü:** plugin (`@medusajs/tenant-plugin`)
- **Mimari katman:** **kontrol düzlemi** — feature plugin değil ([control-plane.md](../control-plane.md))
- **tenant_id taşıyor mu:** Bu modül `tenant_id`'nin kaynağıdır (Tenant + Membership). CMS pilot'ta uygulandı; diğer plugin'ler bekliyor (#0005).

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 2 (Tenant, TenantMembership) |
| services | ✅ | CRUD |
| api | ✅ | `/admin/tenants` CRUD + members + `/me` |
| admin UI | ✅ | Settings → Organization + Team (header switcher) |
| workflows | ✅ | create-tenant, manage-membership |
| middleware | ✅ | `x-tenant-id` → membership → 403 |
| jobs | — | yok |
| migrations | ✅ | DDL + CMS pilot RLS |

## Veri modeli
- **Tenant** — slug, name, status (active|suspended)
- **TenantMembership** — tenant_id, user_id, role; unique composite (tenant_id + user_id)

## Public yüzey
- `GET/POST /admin/tenants` — list (üye olduğun) + create
- `GET/POST /admin/tenants/:id` — detail + update (üye/admin guard)
- `POST/DELETE /admin/tenants/:id/members` — üye ekle/çıkar
- `GET /admin/tenants/me` — aktörün tenant'ları
- Middleware: tüm `/admin/*` → `x-tenant-id` header scope

## Bağımlılıklar & linkler
- rbac (per-tenant RBAC — enforcement bekliyor)
- [ADR-0001](../../adr/0001-multi-tenancy.md)
- [control-plane.md](../control-plane.md)

## Durum (2026-07-02)
- **Yapılan (A1):** tenant-context middleware, CMS pilot `tenant_id` + RLS (3 tablo), izolasyon testi (wesan/beta).
- **Yapılan (A2):** kontrol-düzlemi API, Settings UI (organization/members), header workspace switcher, runtime header sync (reload yok).
- **Kalan:**
  1. `tenant_id` + RLS rollout — revenue, content, loyalty (#0005)
  2. Medusa core `store_id` scope (#0005)
  3. RBAC enforcement (A3)
  4. Entitlement + onboarding (A4, A6)
  5. Davet akışı (e-posta link)

## Hizmet ettiği dikeyler
HEPSİ — platform omurgası.

## Kanıt yolları
- `packages/plugins/tenant/src/modules/tenant`
- `packages/plugins/tenant/src/api/middlewares.ts`
- `packages/plugins/tenant/src/migrations/Migration20260629120000.ts`
- `packages/admin/dashboard/src/routes/organization/`
- `packages/admin/dashboard/src/lib/client/client.ts` — `tenantHeaders` + `x-tenant-id`
