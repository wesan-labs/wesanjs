# sector-sets — Çok-Dikeyli Panel Katalogu (v0, review'e açık)

> Platform = ticaret paneli değil; **her sektöre "hazır set" sunan plugin-tabanlı panel fabrikası.** Bir müşteri bir dikey (commerce / klinik / otel) + üstüne yetenek paketleri (social / cms / analytics) alır; sidebar buna göre şekillenir.
> wesanjs (Medusa fork) üstünde; her set/paket = **bağımsız plugin** (`loyalty` şablonundan kopya).
> Kardeş spec'ler: [WESANJS-SPEC.md], [HELM-SPEC.md], [REVENUE-SPEC.md]. Geliştirme süreci: [PLUGIN-DEV-PROCESS.md].

---

## 1. Durum — dürüst envanter

**Var (kanıt — kod okundu):**
- **Sidebar mekanizması native.** Bir plugin route'u `defineRouteConfig({ label, icon })` yazınca build sırasında (`packages/admin/admin-vite-plugin/src/routes/generate-menu-items.ts`) taranıp `getMenu("coreExtensions")`'a giriyor, sidebar'a **otomatik** düşüyor. Kanıt: `packages/plugins/loyalty/src/admin/routes/gift-cards/page.tsx:33-36`.
- **İki zone hazır.** Core route'lar (bugün `main-layout.tsx:232-305` `useCoreRoutes()`'ta hardcoded) = **main**; non-nested plugin item'ları bir divider'dan sonra = **Extensions** (`main-layout.tsx:422-439`).
- **Kullanıcı düzenleme altyapısı hazır.** `LayoutComposer` sidebar entry'lerini **kullanıcı başına, server-side** sıralar/gizler — SETTINGS modülünde `zone` + `user_id` anahtarlı (`packages/medusa/src/api/admin/layouts/[zone]/configuration/route.ts`). Biz buna dokunmuyoruz.
- **Yetenek paketlerinin çoğu:** `plugins/{cms,content,revenue,mail,loyalty}` gerçek plugin olarak var.

**Yok:**
- ❌ **İkinci dikey çekirdek.** Commerce dışında hiç sektör yok. Tüm çok-dikeyli iddia buna bağlı.
- ❌ **Tenant → dikey/paket ekseni.** Tenant modeli yalın: `{ id, slug, name, status }` (`plugins/tenant/src/modules/tenant/models/tenant.ts`). "enabled_packages" katmanı (#0006) **hiç yazılmamış** — model yorumunda referans var, kod yok.
- ❌ **Dikey-plugin'in "ben main'im" diyebilmesi.** `nested` bugün kapalı 6-değerli commerce union'ı (`admin-shared/src/extensions/routes/constants.ts`). Yeni bir main-grup açılamıyor.

**Çıkarım:** Extensions tarafı ~%80 hazır, main tarafı boş. Enerji main'e (sektör çekirdekleri) gidecek. Backend veri modeli asıl iş; sidebar wiring ucuz.

---

## 2. Model — iki zone, iki primitif tipi

```
┌─ main zone (başlıksız, üstte) ──── müşterinin DİKEYİ (aldığı sektör paneli)
│    Commerce müşterisi → Orders, Products, Inventory, Customers, Promotions, Price lists
│    Klinik müşterisi   → Hastalar, Randevular, Hizmetler, Personel, Reçeteler, Faturalama
│
├─ Extensions zone (başlıklı, altta) ── üstüne taktığı YETENEK PAKETLERİ (tekrar-satılan)
│    Social Media · CMS · Analytics · Content Studio 3D · Ads · WhatsApp ...
│
└─ Settings (en altta, sabit) ──── org, kullanıcılar, roller, paket yönetimi
```

**Kilit ayrım:** dikey ve yetenek **aynı mekanizmayla** (Medusa plugin + `defineRouteConfig`) doğar; tek fark hangi zone'a düştükleri. Extensions zone bugün native çalışıyor; main zone'a plugin düşürmek → §5'teki tek tweak.

---

## 3. Omurga — her sektör aynı 7 slotu doldurur

Verimlilik kaynağı: sektörü sıfırdan tasarlamıyoruz, **tek iskeleti dolduruyoruz.** Her operasyonel iş aynı soyut şeyleri yönetir.

| Slot | Ne demek | Commerce | Sağlık/Klinik | Otel | Restoran | Emlak |
|------|----------|----------|---------------|------|----------|-------|
| **Dashboard** | Genel bakış | Overview | Overview | Overview | Overview | Overview |
| **Sunumlar** (katalog) | Ne satıyor/veriyor | Products | Hizmetler | Oda tipleri | Menü | İlanlar |
| **Kişiler** (dizin) | Kime hizmet | Customers | Hastalar | Misafirler | Müşteriler | Lead/Müşteri |
| **İşlemler** (kayıt) | Değişim olayı | Orders | Randevular | Rezervasyonlar | Adisyonlar | Sözleşmeler |
| **Kaynaklar** (envanter) | Neyle sunuyor | Stok | Personel/Odalar | Odalar/Kat hizm. | Masalar/Mutfak | Portföy/Danışman |
| **Operasyon** | Teslim akışı | Fulfillment | Çizelge/Sıra | Check-in/out | KDS/Mutfak | Görüntüleme/Evrak |
| **Para** | Fiyat/tahsilat | Price lists | Faturalama/Sigorta | Rate/Folio | Adisyon/Bahşiş | Komisyon |

Boş slot bırakılabilir (her sektör 7'sini de kullanmaz). Bu tablo = **set üretim şablonu.**

---

## 4. Dikey çekirdek katalogu (main zone)

Durum kolonları: `✅ var` · `🟡 kısmi` · `⬜ yok`.

| Dikey | Durum | main modülleri |
|-------|-------|----------------|
| 🛒 **E-Commerce** | ✅ | Orders · Products · Inventory · Customers · Promotions · Price lists |
| 🩺 **Sağlık/Klinik** | ⬜ | Hastalar · Randevular · Hizmetler · Personel · Reçeteler · Faturalama |
| 🏨 **Otel/Konaklama** | ⬜ | Rezervasyonlar · Oda tipleri · Misafirler · Kat hizmetleri · Rate/Folio · Check-in |
| 🍽 **Restoran/F&B** | ⬜ | Adisyonlar · Menü · Masalar · Mutfak (KDS) · Kuryeler |
| 🏠 **Emlak** | ⬜ | İlanlar · Müşteriler · Sözleşmeler · Portföy · Görüntülemeler |
| 🎓 **Eğitim/Akademi** | ⬜ | Öğrenciler · Kurslar · Ders programı · Eğitmenler · Ödeme |
| 💼 **Ajans/Hizmet** | ⬜ | Projeler · Müşteriler · Görevler · Zaman/Fatura |
| 💪 **Fitness/Salon** | ⬜ | Üyeler · Seanslar · Paketler · Eğitmenler · Ödeme |
| 🚚 **Lojistik** | ⬜ | Sevkiyatlar · Araçlar · Rotalar · Sürücüler |

> Bu tablo **katalog** — satış/roadmap içindir. **Build kuyruğu değildir** (§7). Bir dikey "var" olması için uçtan uca çalışması + gerçek data ile doğrulanması gerekir.

---

## 5. Yetenek paketi katalogu (Extensions zone)

| Paket | Durum | Plugin | İş |
|-------|-------|--------|-----|
| 📱 Social Media | ✅ | `plugins/content` (Zernio) | zamanlama/paylaşım |
| 📄 CMS | ✅ | `plugins/cms` | içerik/sayfa |
| 🎨 Content Studio 3D | 🟡 | `plugins/content` (pilot) | 3D ürün medyası (Flux→Seedance) |
| 💰 Revenue | ✅ | `plugins/revenue` | çok-kaynaklı gelir/gider |
| ✉️ Mail | ✅ | `plugins/mail` | e-posta |
| 🎁 Loyalty | ✅ | `plugins/loyalty` | hediye kartı/store credit |
| 📊 Analytics | ⬜ | — | çapraz-sektör metrik |
| 🟢 WhatsApp | ⬜ | — | mesajlaşma/otomasyon |
| 📣 Ads/AdSense | ⬜ | — | reklam geliri |

**Gözlem:** Yetenek tarafı büyük ölçüde hazır — eksik olan sadece **main zone'a düşme yeteneği** (bugün her plugin Extensions'a düşüyor). Dikey çekirdeklerin main'de görünmesi için tek tweak gerekir: manifest'te bir `zone: "main"` işareti (detay [PLUGIN-DEV-PROCESS.md] §4).

---

## 6. "Hazır set" = veri. Manifest formatı

Bir set, satılabilir bir birimdir ve şu manifest ile tanımlanır (kaynak: her plugin'in `src/admin/set.ts`'i — öneri):

```ts
export const set = defineSet({
  id: "clinic",                       // benzersiz
  kind: "vertical",                   // "vertical" | "capability"
  zone: "main",                       // vertical → main, capability → extensions
  label: "Klinik",
  icon: Stethoscope,
  rank: 20,
  modules: [                          // main zone'daki modüller (7-slot doldurması)
    { label: "Hastalar",   to: "/clinic/patients" },
    { label: "Randevular", to: "/clinic/appointments" },
    // ...
  ],
  recommends: ["social", "cms"],      // birlikte satılan yetenek paketleri
})
```

Bu manifest = **tek doğruluk kaynağı**: neyin satıldığı, sidebar'da nasıl göründüğü, hangi paketle bundle edildiği. Katalog (bu doküman) manifestlerin insan-okunur özetidir.

---

## 7. Kilitli kararlar

| # | Karar | Gerekçe |
|---|-------|---------|
| S1 | Her dikey/yetenek = **bağımsız plugin** (`packages/plugins/*`) | tek sorumluluk; polyrepo felsefesi; standalone satılabilir |
| S2 | main = dikey · Extensions = yetenek; **ikisi de `defineRouteConfig` ile** | tek mekanizma, sıfır özel-durum |
| S3 | Sektör = **7-slot şablonundan** doldurulur | ad-hoc değil sistematik; yeni sektör = slot doldurma |
| S4 | **Şablon/generator 2. sektörden SONRA** çıkarılır | DRY ≥3 kuralı; önce generator yazmak = bitirmeden dağılmak |
| S5 | **Katalog ≠ build kuyruğu.** Kuyruk her zaman TEK dikey | 3 başarısız denemenin panzehiri (memory kanıtı) |
| S6 | Kullanıcı düzenleme = mevcut `LayoutComposer`; **yeniden yazılmaz** | server-side per-user zaten çalışıyor |
| S7 | Per-tenant paket filtresi (#0006 entitlement) **ertelenir** | önce "1 dikey çalışıyor" kanıtı; filtre 2. adım |

---

## 8. Disiplin — bitirme kuralı

▎ **Bu dokümandaki 9 dikey × 7 slot = 63 modül yazmak DEĞİL amaç. Amaç: 1 commerce-dışı dikeyi uçtan uca çalıştırmak, deseni kanıtlamak, sonra şablonla çoğaltmak. Katalog yazmak bitirmek değildir — build kuyruğunda her zaman tek satır olacak.**

**Build kuyruğu (canlı):**
1. `[ ]` İlk commerce-dışı dikey seç (öneri: Ajans/Hizmet ya da Klinik-lite — en yalın, envantersiz)
2. `[ ]` O dikeyin plugin iskeleti + 7-slot modelleri + admin route'ları
3. `[ ]` main-zone tweak (dikey-plugin main'e düşsün)
4. `[ ]` Gerçek data seed + admin'de sidebar doğrulama
5. `[ ]` Desen otur → generator (S4) → 2. dikey

Sonraki dikey **ancak** bir önceki uçtan uca çalışınca açılır.

---

## 9. Kuzey yıldızı — AI panel composer (FAZ 3-4, kuyrukta DEĞİL)

**Vizyon:** müşteri dashboard'da değil, **marketing yüzeyinde yapay zekayla konuşarak** kendi panelini kurar. "Diş kliniğim var, Instagram'da paylaşırım" → Klinik dikeyi + Social paketi provision edilir, canlı panel doğar. Satış + kurulum + konfigürasyon tek konuşma.

**Kanıt (repo okundu, 2026-07-10) — bugün ne var/yok:**
- ❌ Marketing/onboarding/composer arayüzü wesanjs'te **yok** — `www/apps/*` tamamen dokümantasyon. Marketing wesan/friday'de yaşıyor (repolar arası).
- ❌ Runtime paket provisioning **yok** — #0006 entitlement sadece tenant.ts yorumunda, kod yok.
- ✅ AI tesisatı **var** — `plugins/content/src/lib/ai/content-generator.ts` (Gemini) + prompt-library + generate route. Composer bu deseni kopyalar, sıfırdan değil.

**Bağımlılık zinciri (çatı en üstte):**
```
AI Composer (FAZ 3-4)  →  Runtime entitlement #0006 (FAZ 2)  →  ≥2 set (FAZ 1)  →  set mekanizması + 1 dikey (FAZ 0, şu an)
```

**Kural:** composer, altındaki 3 kat inşa edilmeden anlamsız (tek set'le "AI seçiyor" demosu olmaz). Kuzey yıldızı olarak durur, **build kuyruğunu (§8) şişirmez.** Cazibesi = §8'deki tuzağın en tehlikeli hali; çatıyı önce çizme.
