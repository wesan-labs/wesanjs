# Helm — SaaS Panel Spec (v0, review'e açık)

> Helm = bir **SaaS şirketi sahibinin** paneli: mobil uygulama/oyun **istatistikleri, analizleri, kullanıcı etkileşimleri**.
> wesanjs (Medusa fork) üstünde, **tek admin engine** + plugin kompozisyonuyla. E-ticaret (fiziksel satış) YOK.

---

## 0. ALTIN KURAL — UI sistemi BURADAN (wesanjs), sıfırdan UI YOK

Helm'in tüm arayüzü mevcut tasarım sistemini tüketir — yeni component kütüphanesi yazılmaz:
- **`@medusajs/ui`** (`packages/design-system/ui`) — button, table, drawer, modal, date-picker, badge, heading, …
- **`@medusajs/icons`** (`packages/design-system/icons`) + **`ui-preset`** (Tailwind)
- **Admin yapı taşları** (`packages/admin/dashboard/src/components`): `data-table`, `data-grid`, `filtering`, `forms`, `inputs`, `layout`, `modals`
- **Şablon:** `packages/plugins/loyalty` admin'i (UI'ı buradan çeker — `@medusajs/ui` 99×, `icons` 32×). Helm aynı deseni kopyalar.

---

## 1. Mimari (kararlar)

- **Tek admin engine.** Kabuğu (`packages/admin/dashboard`) FORKLAMA. Helm = plugin enjeksiyonu.
- **Helm = plugin kompozisyonu**, ayrı kabuk değil. (Kabuğu kopyalamak = 80k satır + ~1650 bağ = pahalı tuzak.)
- **Commerce'i gizle, silme:** `get-route.map`'i panel-tipi/flag aware yapan tek cerrahi değişiklik → commerce route'ları Helm panelinde mount olmaz. Kabuk tek kalır.
- **Backend host config sadece generic modülleri yükler** (commerce modülleri yüklenmez).

---

## 2. Ne nereye

```
apps/host/                         # çalışan backend (FAZ 0'da yaratılır, workspaces'e eklenir), port 9999
└── medusa-config.ts
    modules:  auth, user, rbac, customer, analytics, notification, file, settings   ✓ generic
              (cart, order, payment, product, inventory, tax... YÜKLENMEZ)            ✗ commerce
    plugins:  [ app-management ]   # ileride + ads, crm, cms

packages/plugins/app-management/   # ★ loyalty'den KOPYALA-DEĞİŞTİR
└── src/
    ├── modules/app/               # App modeli: id, name, platform(ios/android), store_refs, status
    ├── api/admin/apps/            # /admin/apps CRUD + stats endpoint'leri
    └── admin/                     # UI — @medusajs/ui + dashboard/components/data-table ile
        ├── routes/apps/           #   Apps listesi (data-table) + App detay
        └── widgets/               #   gelir / etkileşim widget'ları
```

Mevcut `packages/{core,modules,admin,design-system}` = DOKUNMA, yeniden kullan.

---

## 3. Helm panelinin sayfaları (SaaS sahibi ne görür)

- **Dashboard (home):** özet — toplam app, DAU/MAU, gelir, son etkileşimler.
- **Apps (liste):** kayıtlı mobil app/oyunlar — `data-table` (platform, durum, install, gelir).
- **App detay:** sekmeler —
  - *İstatistik:* install, DAU/MAU, retention, oturum süresi (grafik: `@medusajs/ui` + chart).
  - *Analiz:* analytics modülünden olay/funnel.
  - *Kullanıcı etkileşimleri:* event timeline, segment.
  - *Gelir:* (ileride `ads` plugin'i ile reklam geliri).
- **Veri kaynağı:** `analytics` modülü (zaten var) + app-management'in App kayıtları.

---

## 4. Yöntem — kopyala-değiştir (sıfırdan değil)

1. `packages/plugins/loyalty` → `packages/plugins/app-management` kopyala.
2. loyalty domain'ini (gift-card, store-credit) sil → App domain'i koy (model + service + migration).
3. Admin route'larında UI iskeletini koru (`@medusajs/ui`, `data-table`, `forms`) → içeriği App stats'a çevir.
4. `apps/host/medusa-config.ts`'e `plugins:[{resolve:"@wesanjs/app-management"}]` ekle.

---

## 5. Çalıştırma & sıra

- **FAZ 0 — İskele:** docker postgres(:5432) + `yarn install` + `apps/host` (port **9999**) + migrate → boş admin `:9999/app`.
- **FAZ 1 — app-management:** loyalty'den kopya → App modeli + Apps sayfası. **Kabuk doğrulanır.**
- **FAZ 2 — istatistik/analiz UI:** App detay sekmeleri (stats/analytics/interactions) + commerce nav gate.
- **FAZ 3 — ads:** reklam geliri widget'ı.
- (Sonra) crm, cms aynı motora plugin olarak eklenir → Helm en zengin kompozisyon.

---

## 6. Açık kararlar

- **D1 — app-management + ads:** ayrı 2 plugin (öneri) mi, tek `helm-core` mı?
- **D2 — commerce gate:** feature-flag ile mi, panel-tipi config ile mi gizlensin?
- **D3 — rename:** EN SONDA (`@medusajs/* → @wesanjs/*`).
