# Kimlik & Tenancy — model ve mevcut durum (kod-kanıtlı)

> Kaynak: backend güvenlik audit'i (2026-07-10, `beta` branch; dosya:satır referansları o güne ait).
> Karar bağlamı: [ADR-0001](../adr/0001-multi-tenancy.md) (izolasyon stratejisi) ·
> [ADR-0004](../adr/0004-product-sequence-composable-panel.md) (ürün sırası + düzeltme kuyruğu).
> Bu doküman **ne olduğunu** kaydeder; ne yapılacağı task'lardadır (#0005, #0006, #0014).

---

## 1. Üç kimlik tipi — karıştırma

| Kavram | Tablo/Modül | Ne | Örnek |
|--------|-------------|-----|-------|
| **Tenant** | `tenant` (tenant plugin) | Satın alan müşteri = bir **işletme** | "Acme Kliniği" |
| **Üye** | `user` (Medusa) + `tenant_membership` | İşletmenin **panele giren çalışanları** | klinik admini, sekreter |
| **Customer** | `customer` (Medusa) | İşletmenin **kendi son-kullanıcıları** | kliniğin hastaları, mağazanın alıcıları |

▎ **İki ayrı "müşteri yönetimi" vardır ve asla karışmamalı:**
▎ (a) **platform → tenant**: biz kimlere sattık (tenant CRUD, entitlement, faturalama);
▎ (b) **tenant → customer**: işletme kendi son-kullanıcısını yönetir (dikeyin Kişiler slotu).
▎ Ayrı tablolar, ayrı yaşam döngüsü, ayrı UI. Bir üye (user) birden çok tenant'ta üye olabilir;
▎ customer ise tek işletmenin verisidir.

## 2. Şema — bugün DB'de olan

Kaynak: `packages/plugins/tenant/src/modules/tenant/` (migration `Migration20260629120000.ts`).

```
tenant
  id (PK) · slug (unique, deleted_at null iken) · name · status (default 'active')
  created_at · updated_at · deleted_at

tenant_membership
  id (PK) · tenant_id (FK) · user_id (FK)
  role: admin | manager | member (default 'admin')
  rbac_role_id (nullable — per-tenant rol override, RBAC #0007)
  created_at · updated_at · deleted_at
  UNIQUE (tenant_id, user_id) WHERE deleted_at IS NULL
```

Tenant modeli **kasıtlı yalın** — plan/paket/dikey alanı yok; o eksen entitlement
katmanına (#0006) ait. `entitlement` tablosu **henüz yok**.

## 3. İstek yolculuğu — izolasyon nasıl çalışıyor

```
Admin UI  (aktif tenant seçimi: localStorage + x-tenant-id header — hooks/api/tenants.ts)
   │  JWT (Medusa auth) + x-tenant-id: T
   ▼
tenantContext() middleware — plugins/tenant/src/api/middlewares.ts:24-71
   üyelik sorgusu: actor gerçekten T'nin üyesi mi? (api/lib/require-membership.ts:10-31)
   ├─ üye değil → 403        ← sahte header burada ölür
   └─ üye      → req.tenant_id = T (+ rol çözümü: resolve-tenant-rbac-roles.ts:27-46)
   ▼
route handler — tenant filtresi UYGULAYAN pluginlerde:
   ör. revenue: api/lib/tenant-guard.ts:14-57 (tenantScopeFilter / stampTenantId)
   ▼
Postgres 16 — RLS policy'leri TANIMLI (content/cms/revenue migration'ları)
   ama session var (`app.current_tenant_id`) hiç SET edilmediği için PASİF
```

Üye yönetimi yetkisi: `tenants/[id]/members/route.ts` — ekleme/silme/güncelleme
öncesi aktörün o tenant'ta **admin** olduğu ve hedef üyeliğin o tenant'a ait olduğu
doğrulanıyor. Bir tenant admini başka tenant'ın üyelerine dokunamaz.

## 4. Verdict — ne korunuyor, ne korunmuyor

| Katman | Durum | Kanıt |
|--------|-------|-------|
| Sahte `x-tenant-id` (üyesi olunmayan tenant) | ✅ 403 | middlewares.ts:24-71 |
| Çapraz-tenant okuma/yazma (custom pluginler: revenue/cms/content) | ✅ app-layer engelli | tenant-guard.ts + route kontrolleri |
| Üye ekleme/silme yetkisi | ✅ admin-rol + aidiyet kontrolü | members route'ları |
| **DB-katmanı (RLS)** | 🟡 **kanıtlı ama runtime'a bağlı değil** | mekanizma canlı DB'de doğrulandı (verify-rls.mjs 19/19, 2026-07-16: strict deny + WITH CHECK reddi); runtime hâlâ superuser + `set_config` çağrısı yok → per-txn wiring slice 2 (#0014) |
| **RBAC route enforcement** | 🟡 **deklare edildi, flag kapalı** | sözleşme = middlewares.ts `MiddlewareRoute.policies` (customers'ta 20+ hazır); tenant mutasyonları #0014'te eklendi; `MEDUSA_FF_RBAC` açılışı #0008 rol-seed bekliyor |
| **Medusa core (product/order/customer)** | 🔴 tenant-scoped değil | tablolar tenant_id'siz; #0005 backlog |
| Entitlement (paket erişimi) | ❌ yok | #0006 backlog — tüm tenant'lar her modüle erişebilir |
| JWT/auth konfigürasyonu, rate-limit | ⚠️ denetlenmedi | bu audit kapsamı dışında; ayrı bakılmalı |

**Tek cümle:** izolasyon bugün **tek katmanlı** (app-layer, çalışıyor) — ADR-0001'in
defense-in-depth hedefinin yarısı; DB sigortası ve rol enforcement'ı kapalı.

## 5. Açıklar → düzeltme eşlemesi

| Açık | Düzeltme | Task | Ne zaman |
|------|----------|------|----------|
| RLS uykuda | ✅ kanıt script'i (verify-rls.mjs 19/19) + rol hijyeni; ❗kalan: per-transaction `SET LOCAL` wiring'i — middleware'den TEK set_config module-pool gerçeğinde yetmez (old-levios da yapmamıştı); framework-hook vs workflow-wrapper kararı | #0014 slice 2 | A1 devam |
| RBAC kozmetik | ✅ tenant mutasyonlarına `MiddlewareRoute.policies` + policy kataloğu (plugin src/policies); ❗kalan: flag açılışı + rol seed | #0014 + #0008 | A1 devam |
| tenant_id'li ama RLS'siz: `product_3d_asset`, `tenant_membership` | RLS policy migration'ı (script bulgusu 2026-07-16) | #0005 | rollout'ta |
| Entitlement yok | tablo + guard + sidebar filtresi | #0006 | A2 |
| Core scoped değil | product/order/customer'a tenant_id + backfill | #0005 | **KAPI**: 2. commerce tenant öncesi |
| Davet/signup yok | members POST sadece var-olan user'ı email'le buluyor (yoksa 404); public signup + davet akışı gerekiyor | (yeni task — A4 öncesi) | A4 öncesi |

## 6. Composer bağlantısı (ADR-0004 K4)

AI composer'ın "provision" adımı bu dokümandaki nesneleri yazar, başka bir şey değil:
`tenant yarat → tenant_membership (kurucu admin) → entitlement satırları (#0006) → set seed'i`.
Yani composer'ın güvenlik yüzeyi = bu dokümandaki izolasyon zinciri. Zincir sağlamsa
composer da sağlamdır; composer için **ek** bir izolasyon mekanizması tasarlanmaz.
