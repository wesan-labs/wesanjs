# #0009 — İki tenant izolasyon kanıtı (E2E)

| | |
|---|---|
| **Durum** | 🟡 Service-layer doğrulandı — UI switch kaldı |
| **Öncelik** | Yüksek |
| **Etiketler** | multi-tenant · qa · onboarding |
| **Bağımlı** | #0004 Faz 3, #0005 (cms/content/revenue) |
| **Onboarding** | [control-plane-onboarding.md](../onboarding/control-plane-onboarding.md) §5 |

## Amaç

İki organizasyon + tek çoklu-üyeli kullanıcı ile **çapraz-tenant sızıntısı olmadığını** UI ve API'de kanıtla. Onboarding ve pilot müşteri güveni için zorunlu demo.

## Kapsam

### Kurulum senaryosu

- [x] Org `tenant_acme` (Acme) + Org `tenant_beta` (Beta) — `seed-isolation-pilot`
- [x] Kullanıcı `pilot@helm.local` her iki org'da `admin` membership
- [x] `admin@helm.local` her iki org'da `admin` membership
- [x] Acme scope: revenue app + expense + content item + cms site
- [x] Beta scope: farklı isimli kayıtlar

### Doğrulama (org switch)

- [x] Service-layer Acme → yalnız Acme kayıtları (`verify-onboarding-pilot`)
- [x] Service-layer Beta → yalnız Beta kayıtları
- [ ] Header Acme → yalnız Acme kayıtları (UI)
- [ ] Header Beta → yalnız Beta kayıtları (UI)
- [ ] Switch sonrası sayfa yenileme gerekmez
- [ ] `x-tenant-id` olmayan istek (legacy) — dokümante davranış

### Modül matrisi

| Modül | Test | Service | UI |
|-------|------|---------|-----|
| Revenue | overview, apps, expenses | ✅ | ⬜ |
| Content | items list | ✅ | ⬜ |
| CMS | sites list | ✅ | ⬜ |
| Tenant | members list org-scoped | ⬜ | ⬜ |

### İsteğe bağlı (DB sigorta)

- [ ] `levios_app` + `SET app.current_tenant_id` ile RLS doğrulama script'i

## Bitti sayılır

- [ ] Onboarding §5 checklist ✅ (UI maddeleri kaldı)
- [ ] Kanıt notu (ekran görüntüsü veya kısa video) onboarding'e eklenmiş
- [ ] Bulunan gap varsa ayrı bug task açılmış

## Not

App-layer scope bugün aktif; RLS prod `levios_app` connection'da defense-in-depth. İkisi birlikte #0004 “bitti” kriterini kapatır.

## Script'ler

- `seed-isolation-pilot.ts` — org + veri + pilot kullanıcı
- `verify-onboarding-pilot.ts` — Finance RBAC + tenant isolation assert
