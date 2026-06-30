# tenant — Multi-tenant omurga (Tenant + TenantMembership)   🟡 Kısmi

## Ne yapar
Tenant (müşteri org) + TenantMembership (kullanıcı-tenant-rol). Tüm domain tabloları tenant_id taşıyacak, RLS izolasyon hedefi.

## Tür & katman
- **Tür:** plugin (tenant)
- **Katman:** platform omurgası / multi-tenancy
- **tenant_id taşıyor mu:** Bu modül tenant_id'nin kaynağıdır (Tenant + Membership). Diğer tablolara henüz uygulanmadı.

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 2 (Tenant, TenantMembership) |
| services | 🟡 | stub |
| api | 🔴 | YOK |
| admin | 🔴 | YOK |
| workflows | 🔴 | YOK |
| jobs | — | yok |
| migrations | ✅ | 1 (tam DDL) |

## Veri modeli
- **Tenant** — slug, name, status (active|suspended)
- **TenantMembership** — tenant_id, user_id, role; unique composite (tenant_id + user_id)

## Public yüzey
- yok (service stub; API/workflow yazılmadı)

## Bağımlılıklar & linkler
- rbac (per-tenant RBAC)
- İlgili: [../../adr/0001-multi-tenancy.md](../../adr/0001-multi-tenancy.md)

## Durum
- **Yapılan:** model + migration (DDL, unique slug index, soft-delete index, membership composite + user index).
- **Yapılmayan/eksik:** **RLS policy SQL YAZILMAMIŞ → tenant_id izolasyonu fiilen DEVREDE DEĞİL**; API yok; admin yok; workflow yok.
- **Yapılacak (kritik yol, sıralı):**
  1. PostgreSQL RLS policy (tenant_id scope)
  2. API (tenant + membership CRUD)
  3. admin UI
  4. addMember/removeMember/changeStatus workflow
  5. cross-tenant izolasyon testi

## Hizmet ettiği dikeyler
HEPSİ — platform omurgası.

## Kanıt yolları
- `packages/plugins/tenant/src/modules/tenant`
- `packages/plugins/tenant/src/migrations/Migration20260629120000.ts`
