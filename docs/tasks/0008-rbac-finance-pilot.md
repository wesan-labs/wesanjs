# #0008 — RBAC Finance pilot + onboarding şablonu

| | |
|---|---|
| **Durum** | 🟡 Service-layer doğrulandı — UI checklist kaldı |
| **Öncelik** | Yüksek |
| **Etiketler** | rbac · onboarding · revenue |
| **Bağımlı** | RBAC helm'de aktif (#0004 A3) |
| **Onboarding** | [control-plane-onboarding.md](../onboarding/control-plane-onboarding.md) §4 |

## Amaç

İlk **kısıtlı üretim rolü** (Finance) ile RBAC'i onboarding'de kanıtla. Super admin dışı kullanıcıda revenue read + expense CRUD çalışsın; sync/app yönetimi kapalı kalsın.

## Kapsam

- [x] Onboarding dokümanı (Finance bölümü + checklist)
- [x] `seed-finance-role` migration script (`role_finance` + policy link)
- [x] Helm'de script çalıştırıldı doğrulaması (3/3 policy linked)
- [x] `seed-finance-pilot-user` migration script
- [x] Test kullanıcısı: `finance@helm.local` (super admin rolü **yok**)
- [x] Service-layer: `revenue:read` + `expense:create` izinli, `revenue:update` yasak (`verify-onboarding-pilot`)
- [ ] Pozitif: revenue pano + gider ekle/sil (manuel UI)
- [ ] Negatif: sync 403 (manuel UI veya API)
- [ ] Dashboard: Finance kullanıcısında Revenue menüsü görünür

## Teknik notlar

- Policy kaynakları: `packages/medusa/src/policies/revenue.ts` → `revenue:*`, `expense:*`
- API guard: `packages/plugins/revenue/src/api/middlewares.ts`
- UI guard: `RoutePermissionGuard` + `revenue:read` on `/revenue`
- Finance policy set (minimum): `revenue:read`, `expense:create`, `expense:delete`
- Verify script: `packages/medusa/src/migration-scripts/verify-onboarding-pilot.ts`

## Bitti sayılır

- [ ] Onboarding §4 checklist tamamen ✅ (UI maddeleri kaldı)
- [x] Yeni helm kurulumunda script otomatik Finance rolünü oluşturur
- [x] Dokümante edilmiş test kullanıcı akışı destek tarafından tekrarlanabilir
