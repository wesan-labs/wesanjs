# #0004 — Tenant foundation (omurga + context middleware) + kanıt dilimi

| | |
|---|---|
| **Durum** | 🟢 Hazır — **ilk başlanacak iş** |
| **Öncelik** | Yüksek |
| **Etiketler** | multi-tenant · backend · core |
| **Oluşturma** | 2026-06-29 |
| **Karar** | ADR-0001 |

## Amaç
Multi-tenant omurgasını kur ve **TEK plugin'de** (content-plugin — bizim, küçük, taze)
uçtan uca kanıtla. Sosyal-arkın modeli: bir dilim end-to-end + canlı doğrulama, sonra yay.

## Kapsam (kanıt dilimi)
- [ ] `Tenant`/`Organization` modülü (entity: id, slug, name, status) — yeni plugin modülü (package.json `exports`'a 2 satır!)
- [ ] `TenantMembership` (user_id ↔ tenant_id ↔ role) — kullanıcı hangi tenant'ta hangi rol
- [ ] **Tenant-context middleware:** her admin request'te aktif tenant'ı çöz (header/subdomain/JWT claim) → Postgres session var set (`SET app.current_tenant = ...`) RLS için
- [ ] content-plugin tablolarına `tenant_id` ekle (`content_item`, `social_snapshot`) + migration
- [ ] Bu iki tabloda **Postgres RLS policy** (`USING (tenant_id = current_setting('app.current_tenant')::text)`)
- [ ] Yazma yolunda tenant_id otomatik enjekte (workflow/route)

## Bitti sayılır (canlı doğrulama)
- [ ] İki test tenant; tenant A'nın içeriği tenant B'ye **sızmıyor** (RLS ile, app-WHERE'siz bile)
- [ ] Middleware tenant'ı doğru çözüyor; yanlış/eksik tenant → 403
- [ ] content-plugin route'ları tenant-scoped çalışıyor (gerçek DB)

## Not
- Bu dilim **referans implementasyon** — #0005 diğer modüllere bunu kopyalar.
- Medusa core (ürün/sipariş) bu issue'da DEĞİL → #0005'te Store Module `store_id` ile.
