# plugin-dev-process — Sektör/Yetenek Plugin'i Nasıl Doğar (v0)

> Bir "hazır set"i (dikey ya da yetenek) sıfırdan çalışır sidebar girişine götüren adım-adım süreç. Amaç: **tekrarlanabilir, gerçek-data ile doğrulanmış, kabuk (shell) forklamadan.**
> Kardeş: [SECTOR-SETS-SPEC.md] (ne inşa edileceği), [WESANJS-SPEC.md], [REVENUE-SPEC.md] (bitmiş plugin örneği deseni).

---

## 1. Mekanizma — bir route nasıl nav'a dönüşür (kanıt)

Elle sidebar'a ekleme YOK. Zincir build zamanında otomatik:

```
src/admin/routes/<modül>/page.tsx
  └─ export const config = defineRouteConfig({ label, icon })   ← label şart; yoksa nav'a girmez
        │
        │ (build) admin-vite-plugin/src/routes/generate-menu-items.ts
        │         AST'ten config'i okur, dosya yolundan path üretir
        ▼
  plugin.menuItemModule.menuItems[]
        │ dashboard-app.tsx:145-241  populateMenus()
        ▼
  getMenu("coreExtensions")  →  main-layout.tsx SidebarRoutes  →  Extensions zone'da render
```

**Doğrulanmış kısıtlar (Explore ajanı, kod okundu):**
- `label` yoksa route gizli (sadece sayfa, nav yok) — `generate-menu-items.ts:225-228`.
- Nesting **tek seviye**: `INavItem.items: NestedItemProps[]`, `NestedItemProps`'ta tekrar `items` yok. 2+ seviye modellenmemiş.
- `nested` bugün kapalı commerce union'ı (`admin-shared/.../routes/constants.ts`) — yeni main-grup açmak için §4 tweak'i gerekir.
- Kullanıcı sıralama/gizleme = `LayoutComposer`, server-side, `nav:${to}` anahtarlı. Plugin geliştiricisi bununla ilgilenmez.

---

## 2. İki plugin tipi — tek şablon, tek fark

| | Dikey çekirdek (vertical) | Yetenek paketi (capability) |
|---|---|---|
| Zone | **main** (§4 tweak) | **Extensions** (native) |
| Örnek | clinic, hotel, restaurant | social, cms, analytics |
| Şablon | `plugins/loyalty` (tam-yığın: module + admin) | aynı |
| set.kind | `"vertical"` | `"capability"` |
| Doldurduğu | 7-slot omurga (SECTOR-SETS §3) | tek bir çapraz yetenek |

Kopya kaynağı: `packages/plugins/loyalty` ve `packages/plugins/draft-order` — ikisi de backend module + `src/admin` + `./admin` export'unu bir arada bulunduran çalışan referanslar.

---

## 3. Süreç — 6 adım (klinik dikeyi örneğiyle)

### Adım 1 — Scaffold
`packages/plugins/sector-clinic/` — `loyalty`'yi kopyala, isimleri değiştir, `package.json` `exports`'a `"./admin"` conditional export'unu koru (dashboard bunu böyle keşfediyor — `loyalty` package.json kanıtı).

### Adım 2 — Veri modelleri (asıl iş burada)
`src/modules/clinic/models/` — 7-slot'un gerektirdiği entity'ler. Medusa deseni (CLAUDE.md §5.1): `model.define` + `MedusaService`.
```
patient.ts       (Kişiler)      appointment.ts  (İşlemler)
service.ts       (Sunumlar)     staff.ts        (Kaynaklar)
invoice.ts       (Para)
```
Migration: `medusa db:generate clinic` → `medusa db:migrate`. **Gerçek DB, mock yok** (CLAUDE.md yasağı).

### Adım 3 — Admin route'ları (nav otomatik gelir)
Her modül = bir `page.tsx`:
```tsx
// src/admin/routes/patients/page.tsx
export const config = defineRouteConfig({ label: "Hastalar", icon: User })
```
`label` verildiği an sidebar'a düşer. İkinci modül `nested` ile ilkinin altına girebilir (tek seviye).

### Adım 4 — Set manifesti
`src/admin/set.ts` — SECTOR-SETS §6 formatı. `kind: "vertical"`, `zone: "main"`, modül listesi, `recommends: [...]`.

### Adım 5 — Wire + seed
- `medusa-config.ts` `plugins[]`'e ekle (host = `helm/`, file-linked).
- `medusa plugin:build` → `.medusa/server`.
- **Gerçek seed**: birkaç hasta/randevu/hizmet (idempotent seed deseni — [levios seed sistemi] referansı).

### Adım 6 — Verify (gözle, testle değil)
- `medusa develop` → admin aç → sidebar'da "Hastalar/Randevular..." main zone'da mı?
- Bir randevu oluştur → DB'de mi? → CLAUDE.md: kritik yol testi, unit obsesyonu yok.
- Görsel doğrulama Can'da (Playwright yok — [no-playwright-can-verifies-visually]).

---

## 4. Tek gerekli çekirdek tweak — main-zone bildirimi

**Sorun (kanıt):** Bugün her plugin route'u Extensions zone'a düşüyor; `useCoreRoutes` (main) hardcoded. Bir dikey-plugin "ben main'im" diyemiyor.

**Çözüm (minimal, faz 0):**
1. `useCoreRoutes()` (`main-layout.tsx:232-305`) hardcoded diziyi **set manifestlerinden okuyan** `useNavGroups()`'a çevir. Görünür değişiklik sıfır — commerce set'i aynı çıkar, sadece veri kaynağı manifest olur.
2. `zone: "main"` olan set'ler main'e, `"capability"` olanlar Extensions'a yönlendirilir (`SidebarRoutes` ayrımı, `main-layout.tsx:381-397`).
3. Permission metadata'yı manifest'e taşı (`requires: [...]`) → merkezi `main-nav-permissions.ts` darboğazını erit.

Bu tweak **1 kez** yapılır; sonra her yeni dikey sadece plugin + manifest ekler, shell'e dokunmaz.

---

## 5. Verimlilik/profesyonellik kuralları

| # | Kural | Neden |
|---|-------|-------|
| D1 | İlk dikeyi **elle** yap; generator YOK | deseni görmeden soyutlama = yanlış soyutlama (DRY ≥3) |
| D2 | 2. dikeyden sonra **scaffold generator** (7-slot → boilerplate) | tekrar kanıtlandı, artık otomatikleştir |
| D3 | Her plugin **bağımsız** derlenir/test edilir | polyrepo; standalone satılabilir |
| D4 | **Gerçek data ile verify**, her adımda | mock/test-data yasağı; "çalışıyor" iddiası kanıt ister |
| D5 | Rename (`@medusajs/* → @wesan-labs/*`) **en sonda** | WESANJS-SPEC deseni; erken rename = kırık import'lar |
| D6 | Kabuk (shell) **forklanmaz**; UI plugin-injected | tek çekirdek tweak (§4) dışında dashboard'a dokunma |

---

## 6. Bitirme kapısı

Bir dikey "DONE" sayılır ancak:
- `[ ]` 7-slot'un en az **Kişiler + İşlemler + Sunumlar** modülü CRUD çalışıyor
- `[ ]` Sidebar'da main zone'da doğru görünüyor (gerçek admin'de)
- `[ ]` Gerçek seed data ile bir uçtan-uca akış (örn. randevu oluştur→listele) çalışıyor
- `[ ]` set manifesti yazıldı (satılabilir birim tanımlı)

Bu kapı geçilmeden **sıradaki dikey açılmaz** (SECTOR-SETS S5).
