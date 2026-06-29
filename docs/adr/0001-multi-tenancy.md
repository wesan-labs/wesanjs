# ADR-0001 — Multi-tenancy mimarisi

- **Durum:** Kabul (2026-06-29)
- **Bağlam:** Panel şu an **tek-tenant** — hiçbir tabloda `tenant_id` yok, tek Medusa
  store, tek JWT, domainler silo (çapraz referans yok). Hedef: gerçek multi-tenant
  SaaS — müşteri **mağazadan modül seçerek kendi panelini kurar**, per-tenant RBAC.

## Karar

1. **İzolasyon — pool: shared-schema + `tenant_id` + Postgres RLS.** Schema-per-tenant
   **değil**, database-per-tenant değil. Enterprise/compliance tenant için dedicated
   schema/db = sonradan "kaçış kapısı" (hybrid: pool default, silo-on-demand).
2. **Kompozisyon — entitlements + per-tenant panel config, always-on modüller üstünde.**
   Per-tenant modül yükleme **değil** (Medusa boot-duvarı → old-levios'ta öldü).
   "Mağaza" = modül kataloğu; "kur" = entitlement satırı + varsayılan rol policy'leri.
3. **Yetkilendirme — Medusa `@medusajs/rbac`** (RbacRole + RbacPolicy{resource,operation}
   + rol kalıtımı), **per-tenant** atama. RBAC-first; ABAC (Cerbos/OPA/Cedar) sadece
   bağlam-bağımlı az sayıda kural için.
4. **Omurga — `Tenant`/`Organization` entity'si.** Kullanıcı→tenant→rol; tüm veri
   tenant ile anahtarlı. Bu omurga aynı zamanda Analytics rollup'ı açar.

## Gerekçe (kanıt)
- **Medusa gerçeği:** `databaseSchema` boot/connection seviyesinde (process başına tek
  schema) → schema-per-tenant ya tenant-başına-process (çok-küçük-tenant'a ölümcül) ya
  da per-request `search_path` (mikro-orm ile dövüşen kırılgan hack). Medusa native
  multi-tenant değil → `tenant_id` + RLS topluluk-önerisi yol (Rigby rehberi).
- **Senin modelin:** çok sayıda küçük self-serve tenant + modül-kompoze → pool+RLS'in
  tam hedefi (binlerce tenant, tek migration, en düşük ops). Schema-per-tenant = schema
  sprawl + modül×tenant migration fan-out.
- **2026 standardı:** pool+RLS ile başla; RLS = "bir eksik WHERE" sızıntısına DB-seviyesi
  sigorta; schema/db-per-tenant'ı sadece compliance/büyük tenant'a sakla.
- **Kompozisyon standardı (WorkOS/Schematic):** entitlements + feature-flag, kod
  değişmeden per-tenant esneklik — boot-duvarının çözümü.
- **RBAC standardı:** kurumsalın %90'ı RBAC; ABAC abartılır (%95 RBAC-şekilli).

## Sonuçlar
- ✅ Tek migration, binlerce tenant'a ölçek, boot-duvarı yok, rollup açılır.
- ⚠️ İnvaziv: kendi plugin tablolarına `tenant_id` + Medusa core'a `store_id`; her
  request'te RLS session var'ını set eden **tenant-context middleware**; auth'a tenant.
- 🚪 Kaçış kapısı: büyük enterprise tenant → dedicated schema/instance, sonradan.

## Sıralama
1. Tenant + üyelik + RBAC temeli (entity, user-tenant-role, middleware→RLS var)
2. `tenant_id` + RLS rollout (önce kendi plugin'ler, sonra core/store_id)
3. Entitlements + per-tenant panel config (mağaza/kompoze katman)
4. Analytics rollup (omurga hazır olunca)

İlgili issue'lar: `tasks/0004`–`0007`. Bkz [[social-publish-system]] (ilk uygulanacak referans plugin).
