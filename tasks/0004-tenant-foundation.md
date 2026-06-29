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
- [x] `Tenant`/`Organization` modülü (entity: id, slug, name, status) — **`@medusajs/tenant-plugin`** kuruldu, helm'e wire, migrate (tablolar gerçek DB'de), boot temiz ✓ (commit 77afeb5af8)
- [x] `TenantMembership` (user_id ↔ tenant_id ↔ role) — model + tablo hazır ✓
- [x] **Faz 0:** default tenant + admin membership seed (`tenant_default`) + non-superuser `app-role.sql` artefaktı ✓ (566c4d4727)
- [x] **Faz 1:** content-plugin tablolarına `tenant_id` (additive nullable) + backfill default tenant'a (4 social_snapshot ✓) + tenant-leading index ✓
- [ ] **Faz 2 (delicate):** Tenant-context middleware (AsyncLocalStorage) + Medusa pg connection patch (`set_config('app.current_tenant')`) — enforcement yok, plumbing
- [ ] **Faz 3:** app-layer query scoping (primary) + RLS policy/`FORCE` (DB-sigorta, prod app_user ile aktif)
- [ ] Bu iki tabloda **Postgres RLS policy** (`USING (tenant_id = current_setting('app.current_tenant')::text)`)
- [ ] Yazma yolunda tenant_id otomatik enjekte (workflow/route)

## Bitti sayılır (canlı doğrulama)
- [ ] İki test tenant; tenant A'nın içeriği tenant B'ye **sızmıyor** (RLS ile, app-WHERE'siz bile)
- [ ] Middleware tenant'ı doğru çözüyor; yanlış/eksik tenant → 403
- [ ] content-plugin route'ları tenant-scoped çalışıyor (gerçek DB)

## Not
- Bu dilim **referans implementasyon** — #0005 diğer modüllere bunu kopyalar.
- Medusa core (ürün/sipariş) bu issue'da DEĞİL → #0005'te Store Module `store_id` ile.
