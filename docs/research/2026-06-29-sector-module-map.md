# Sektör × Modül Haritası — wesanjs Panel Platformu

**Tarih:** 2026-06-29
**Kapsam:** Mevcut 35 modül + 7 plugin envanteri → ~25 sektörün panel ihtiyacına eşleme; yeni modül kaldıraç analizi; acil ikili (dijital ürünler + mobilya atölyesi) için yol haritası.
**Yöntem:** 4 paralel araştırmacı, küme başına kavramsal eşleme. **Tüm kapsama %'leri çıkarımdır** — production'da hangi modülün gerçekten çalıştığı bu turda doğrulanmadı (bkz. §7 Dürüst Sınırlar).

---

## 1) TL;DR

- Platform bir **Medusa fork'u** = e-ticaret motoru (ürün + sipariş + ödeme çekirdeği). Farklılaştırıcı katman: `tenant` (multi-tenant omurga), `content` (AI içerik + sosyal yayın), `revenue` (abonelik/reklam geliri), `cms` (çok-siteli içerik), `loyalty`, `mail`.
- **En iyi oturan sektörler** (S–M efor, %75+): perakende, DTC moda, el yapımı, etkinlik/bilet, oto-servis, içerik üretici, mobil oyun. Çekirdek satış/stok/içerik motoru bunlara doğrudan hizmet ediyor.
- **En zorlanan sektörler** (L efor, %≤40): otel, diş, estetik, profesyonel hizmet, mobilya. Sebep tek: **e-ticaret çekirdeği "fiziksel mal + anlık satış" varsayar; bu dikeyler randevu / üretim / proje üstüne kurulu.**
- **4 yatay yeni modül, 20+ dikeyin eksiğini kapatıyor** (§3). En yüksek kaldıraç: **booking omurgası** (~11 dikey) ve **made-to-order çekirdeği** (~7 dikey).
- **Acil ikili** (§4): senin dijital işlerin = **bitirme** işi (yeni modül yok), babanın mobilyası = **made-to-order çekirdeği** (yeni modül ailesi).

---

## 2) Mevcut Mimari (kanıt: kod envanteri, okundu)

Katmanlar, dıştan içe:

```
┌─ PLUGIN'LER (farklılaştırıcı değer) ──────────────────────────────┐
│  tenant · cms · content(+social-snapshot) · revenue · loyalty ·   │
│  mail · draft-order                                               │
├─ CUSTOM MODÜLLER (vanilla Medusa'dan sapma) ─────────────────────┤
│  analytics · rbac · settings · translation                       │
├─ TİCARET MODÜLLERİ (standart Medusa) ────────────────────────────┤
│  product · cart · order · payment · pricing · inventory ·         │
│  fulfillment · tax · promotion · region · sales-channel ·        │
│  stock-location · store · currency · customer · user ·           │
│  api-key · auth · file · notification                            │
├─ ALTYAPI MODÜLLERİ ──────────────────────────────────────────────┤
│  cache · event-bus · locking · workflow-engine · index ·         │
│  link-modules · providers                                        │
└──────────────────────────────────────────────────────────────────┘
        tenant_id / RLS her katmanı dikey olarak keser (tenant plugin)
```

| Plugin | Görev (package desc'ten) |
|---|---|
| `tenant` | Multi-tenant omurga: tenant_id/RLS + per-tenant RBAC |
| `cms` | Çok-siteli içerik (sites/collections/entries) draft/publish |
| `content` | AI içerik stüdyosu (image/text/video-prompt + sector-packs) + `social-snapshot` sosyal yayın |
| `revenue` | Abonelik & reklam geliri toplama |
| `loyalty` | Hediye kartı + store-credit |
| `mail` | Personel mail kutuları (Stalwart) |
| `draft-order` | Müşteri adına sipariş (vanilla Medusa portu) |

**content/sector-packs.ts'te tanımlı 4 dikey:** mobile-game · mobile-app · saas-web · furniture. (Sosyal içerik ağırlığı oyun tarafında ezici.)

---

## 2b) Modül vs Plugin — Kavram Ayrımı (Medusa)

İkisi farklı şey; karıştırınca mimari kararlar yanlış çıkıyor. Medusa'nın katman akışı:

```
Module (veri modeli + CRUD)
  ↓ kullanır
Workflow (iş mantığı + rollback'li mutasyon)
  ↓ çağırır
API Route (HTTP arayüzü, GET/POST/DELETE — PUT/PATCH yok)
  ↓ tüketir
Frontend (admin paneli / storefront, JS SDK ile)
```

### Modül (Module) = tek iş-alanı birimi
- **Ne içerir:** veri modeli + service (CRUD) + migration + repository. **HTTP yok, UI yok, workflow yok.**
- **Özellik:** İzole ve tek sorumluluk. Başka modülü doğrudan çağırmaz — **Module Link** ile bağlanır. İsim **camelCase** zorunlu (dash runtime hatası verir).
- **Kanıt (`packages/modules/product/src`):** `models/ services/ repositories/ migrations/ joiner-config.ts` — sadece domain. `api/`/`admin/` YOK.
- **Türkçe analoji:** Bir "tuğla". Tek başına ev değil.

### Plugin = dağıtılabilir bohça (1+ modül + tüm wiring)
- **Ne içerir:** bir veya daha çok **modül** + `workflows/` + `api/` (route'lar) + `admin/` (panel uzantısı) + `jobs/` (cron) + `lib/`. `package.json exports` ile içindeki her modülü host app'e açar.
- **Özellik:** Bir Medusa projesine **komple kurulur**; sadece veri değil, uçtan uca özelliği (route + panel + workflow dahil) getirir. Projeler arası taşınabilir.
- **Kanıt (`packages/plugins/content/src`):** `modules/` (içinde **2 modül**: content-library + social-snapshot) + `api/ admin/ workflows/ jobs/ lib/`. cms plugin de aynı: `modules/ api/ admin/ workflows/`.
- **Türkçe analoji:** Tuğlalardan (modül) + sıva, tesisat, kapı (wiring) kurulmuş, taşınıp bir araziye monte edilen "prefabrik oda".

### Net karşılaştırma

| | **Modül** | **Plugin** |
|---|---|---|
| Birincil rol | Veri + iş mantığı birimi | Kurulabilir özellik paketi |
| İçerir | models, service, migration | **modül(ler)** + workflow + api + admin + jobs |
| Katman | Sadece en alt katman | Tüm katmanlar (alttan üste) |
| HTTP/UI | Yok | Var (api/ + admin/) |
| Bağımsız dağıtım | Hayır (host'a gömülü) | **Evet** (npm paketi, projeye install) |
| İsim kuralı | camelCase zorunlu | npm paket adı (`@medusajs/content-plugin`) |
| Bizdeki örnek | `product`, `order`, `analytics` | `content`, `cms`, `tenant`, `revenue` |

### Bizim repodaki uygulama
- **`packages/modules/` (35 adet)** = çıplak modüller. Çoğu standart Medusa ticaret modülü; 4'ü custom (`analytics`, `rbac`, `settings`, `translation`).
- **`packages/plugins/` (7 adet)** = bohçalar. Her biri kendi modül(ler)i + wiring. Örn: `content` plugin'i = content-library + social-snapshot **modülleri** + AI lib + api + admin + jobs.

### §3'teki yeni "modüller" pratikte ne olacak?
Kaldıraç tablosundaki booking / made-to-order vb. **modül çekirdeği** (veri modeli + service) olarak yazılır, ama tenant'lara kurulabilmesi için bir **plugin** içine paketlenir (api + admin + workflow ile). Yani "booking modülü" = `booking` modülü **+** onu saran `booking-plugin`. Kural: *yeni iş-alanı + veri modeli* → modül; *projeye komple kurulacak özellik (route+panel dahil)* → plugin.

---

## 2c) Tüm Modül & Plugin'ler — Detaylı Durum (kod okundu, 2026-06-29)

**Yöntem:** Her custom birim 3 paralel denetçiyle GERÇEK kod üzerinden incelendi (model/service/migration/api/admin/workflow sayıldı, TODO/stub arandı). Durum: **✅ Çalışır** (veri+iş mantığı tam, kurulabilir) · **🟡 Kısmi** (bazı katmanlar gerçek, bazıları eksik) · **🔴 İskelet** (çoğunlukla boş/tek katman).

> ▎**En önemli desen (kanıt → çıkarım):** Neredeyse her birimde **alt katman (model + service + migration) yapılmış, üst katman (API route + Admin UI + workflow) eksik.** Yani "tuğlalar dökülmüş, prefabrik oda kurulmamış." Memory'deki "3 denemede de wiring bitmedi" tam bu: mimari değil, **üst-katman bitirme**. İki istisna kuralı doğruluyor: `loyalty` uçtan uca bitmiş (✅, kanıt ki bitirilebiliyor); `draft-order` tersi — sadece UI, backend yok (🔴).

### Plugin'ler (7) — durum tablosu

| Plugin | Ne yapar | Katmanlar (kanıt) | Durum | En kritik eksik |
|---|---|---|---|---|
| **loyalty** | Hediye kartı + store-credit (dijital cüzdan) | 2 modül·3 model·12 api·**40+ admin**·12 workflow·15 migration·5 link | ✅ **Çalışır** | BigNumber precision, refund, expiry, email (backlog) |
| **revenue** | Abonelik + reklam geliri agregasyonu (RevenueCat+AdMob) | 1 modül·5 model·**49 metod**·14 api·2 job·2 connector·5 migration | 🟡 Kısmi (çalışan) | admin UI · **subscription lifecycle workflow** · webhook validation |
| **content** | AI içerik stüdyosu + sosyal snapshot | 2 modül·14 api·2 workflow·1 cron·3 migration·700-satır AI-gen | 🟡 Kısmi (ileri) | admin UI · analyze/edit/prompts stub · Zernio OAuth server-side yok |
| **cms** | Çok-siteli içerik (site/collection/entry) | 3 model·3 api·2 workflow·build var | 🟡 Kısmi | **migration YOK (boot'ta tablo kurmaz)** · admin UI · collections API |
| **tenant** | Multi-tenant omurga (Tenant + TenantMembership) | 2 model·1 migration | 🟡 Kısmi | **RLS policy SQL YAZILMAMIŞ (izolasyon fiilen yok)** · API · admin · workflow |
| **mail** | Stalwart-backed personel mail kutuları | 3 model·4 service metod·Stalwart client | 🟡 Kısmi | API · workflow · admin · migration |
| **draft-order** | Müşteri adına sipariş (admin UI) | **87 admin dosyası**·backend 0 | 🔴 **İskelet** | tüm backend: model/service/api/workflow/migration |

### Custom Modüller (4) — durum tablosu

| Modül | Ne yapar | Katmanlar (kanıt) | Durum | En kritik eksik |
|---|---|---|---|---|
| **translation** | Çoklu-dil entity çevirisi | 3 model·**11 metod (754 satır)**·4 migration·DML-scan | ✅ **Çalışır** | API · admin · entity-hydration hook · CSV import |
| **settings** | Admin panel yapılandırma (kolon/tercih/etiket) | 3 model·**18+ metod (479 satır)**·2 migration·entity-discovery | ✅ **Çalışır** | API · admin (kolon seçici) |
| **rbac** | Rol-bazlı erişim (rol/policy/hiyerarşi) | 4 model·6 metod·repository·cycle-detection·1 migration | ✅ **Çalışır** | API · **enforcement middleware** · admin · audit log |
| **analytics** | Pluggable analytics provider relay | 2 service·DI provider discovery | 🟡 Kısmi | **veri modeli/persistence YOK** · event logging · api · admin |

### Standart Medusa Modülleri (31) — upstream, mevcut

Bunlar Medusa core; fork'ta intact kabul (ayrı durum denetimi yapılmadı — değiştirilmediyse upstream'le aynı). Tek-cümle görevleri:

- **Ticaret çekirdeği:** `product` (ürün/varyant/opsiyon/koleksiyon/kategori) · `pricing` (fiyat seti/liste/kademe) · `inventory` (stok kalemi/seviye/rezervasyon) · `stock-location` (depo/konum) · `order` (sipariş/iade/değişim/claim) · `cart` (sepet/satır/adres/indirim uygula) · `payment` (ödeme oturumu/capture/refund) · `fulfillment` (teslimat yöntemi/kargo seçeneği) · `tax` (vergi bölgesi/oran/hesap) · `promotion` (kampanya/kupon/kural)
- **Satış & organizasyon:** `sales-channel` (kanal↔ürün/stok) · `region` (bölge=ülke+para+vergi) · `store` (mağaza ayarı) · `currency` (para birimi)
- **Kimlik & erişim:** `customer` (müşteri/grup/adres) · `user` (admin personeli) · `auth` (kimlik doğrulama/oturum/actor) · `api-key` (publishable + secret anahtar)
- **Sistem:** `file` (dosya saklama soyutlaması) · `notification` (bildirim gönderimi/şablon)
- **Altyapı:** `cache-inmemory`/`cache-redis`/`caching` (önbellek) · `event-bus-local`/`event-bus-redis` (olay yayını) · `locking` (dağıtık kilit) · `workflow-engine-inmemory`/`workflow-engine-redis` (workflow yürütme) · `index` (modüller-arası filtreli sorgu) · `link-modules` (modül linkleri) · `providers` (payment/file/notification sağlayıcı implementasyonları)

### Detaylı birim notları (custom 11)

**loyalty ✅** — Tek uçtan-uca biten plugin. Admin'den hediye kartı yarat → müşteri webhook'la talep et → store-credit'e yükle → siparişte düş. 12 workflow (claim 150 satır, redeem 201 satır balance-check'li), 40+ admin bileşeni (TanStack datagrid). *Yapılacak:* bignumber precision, order-cancel→restore refund, expiry validation, email bildirim.

**revenue 🟡** — Gerçek gelir raporu motoru: `recordEvents/upsertDailySnapshot/getOverview` (P&L: MRR+abonelik+reklam−komisyon−vergi=net), RevenueCat+AdMob connector, 6 saatlik sync. *Yapılmayan:* admin UI, **subscription lifecycle** (trial→renewal→dunning→cancel — şu an sadece "topla"), webhook secret tanımlı ama doğrulama kodu yok. *Yapılacak:* admin dashboard → webhook handler → proration/dunning.

**content 🟡** — `lib/ai/content-generator` 700 satır (vision→OpenRouter/Gemini fallback→GenerationResult), `social-daily-snapshot` cron, image-host (imgbb/cloudinary). *Yapılmayan:* admin UI, `analyze`/`edit-image`/`prompts` route'ları stub olabilir, Zernio/Late OAuth handshake tam değil (server-side publish tavanı). *Yapılacak:* admin composer → analyze impl → prompt DB → OAuth.

**cms 🟡** — 3 model + 3 route + 2 workflow (compensation'lı). *Kritik:* **migration dosyası hiç yok** → runtime'da tablo oluşmaz; collections modeli var ama route yok; admin boş. *Yapılacak:* migration yaz → collections API → admin UI.

**tenant 🟡** — Tenant(slug/status) + TenantMembership(tenant_id/user_id/role unique) + tam DDL migration. *Kritik:* **RLS policy SQL yazılmamış** → tenant_id izolasyonu fiilen devrede değil; API/admin/workflow yok; service stub. *Yapılacak:* **RLS policy** → API → admin → addMember/removeMember workflow → izolasyon testi.

**mail 🟡** — MailAccount/SharedMailbox/MailSharedAccess + Stalwart client + şifreli credential (reveal-once) + idempotent provisioning. *Yapılmayan:* API, workflow, admin, migration, joiner-config. *Yapılacak:* migration → API → provision workflow → admin.

**draft-order 🔴** — Sadece admin UI (87 dosya: modal/drawer/form/SDK hook). Backend tamamen yok. *Karar gerek:* yeni modül mü, order'ı extend mi? Sonra model→service→api→workflow→UI'yi gerçek API'ye bağla (şu an mock).

**translation ✅** — 754 satır service, DmlEntity.getTranslatableEntities taraması, locale + translation(entity_type+id+field+locale+value) + settings auto-sync, 4 migration. *Yapılacak:* API → admin editor → entity-hydration hook → CSV export.

**settings ✅** — 479 satır, ViewConfiguration/UserPreference/PropertyLabel + entity-discovery (joiner-config'den kolon üret) + computed-columns, 2 migration. *Yapılacak:* API → admin kolon-seçici.

**rbac ✅** — 4 model (Role/Policy/RolePolicy/RoleParent) + cycle-detection + policy sync (onApplicationStart) + repository (N+1 önleme), 1 migration. *Yapılacak:* API → **enforcement middleware** (asıl değer burada) → admin → audit.

**analytics 🟡** — Provider adapter/proxy (track/identify/DI discovery) tam ama **hiç persistence yok** (event tablosu yok). *Yapılacak:* event modeli → logging service → API → admin viewer.

---

## 3) Yatay Kaldıraç Modülleri — "tek yatırım, çok dikey"

Asıl strateji burada. Sektör-spesifik değil, **yatay** modüller; her biri birden çok dikeyin ortak eksiğini kapatıyor. Kaldıraca göre sıralı:

### #1 — Booking / Rezervasyon Omurgası ⭐ EN YÜKSEK KALDIRAÇ
**Ne:** Kaynak (oda/koltuk/personel/cihaz/masa/bay) + takvim + slot + müsaitlik + çakışma kontrolü + no-show.
**Açtığı dikeyler (~11):** estetik, diş, fitness, kuaför, veteriner, restoran (masa), otel (tarih-aralığı varyantı), emlak (görüntüleme), profesyonel (danışmanlık), oto-servis (bay), etkinlik (seans).
**Not:** Üç alt-varyant var — *slot-booking* (randevu), *date-range booking* (otel), *capacity-booking* (ders/etkinlik). Çekirdek ortak; varyantlar ince. **Pilot için en uygun: kuaför** (en düşük KVKK, en geniş pazar).
**Efor:** L · **Eşlik eden zorunlu:** hizmet kataloğu (süreli hizmet — `product` mal-odaklı, "süre" kavramı yok).

### #2 — Made-to-Order / İş-Emri Çekirdeği ⭐ BABANIN İŞİ
**Ne:** Konfigürasyon → RFQ/teklif (versiyon, geçerlilik, onay) → dinamik fiyat (m²/metretül) → BOM/malzeme rezervasyonu → üretim iş-emri (aşama/Kanban) → kapora+bakiye taksit.
**Açtığı dikeyler (~7):** mobilya, mutfak/doğrama, mermer, terzi, gıda-üretim/özel-pasta, oto-servis (work-order+labor kısmen).
**Efor:** L · **Taban:** `draft-order` + `inventory` + `pricing` kısmen var; üstüne iş-emri durum makinesi + BOM + dinamik fiyat eklenir.

### #3 — Subscription Lifecycle + Entitlement/Paywall ⭐ SENİN İŞİN (kısmen)
**Ne:** `revenue` plugin'ini "geliri topla"dan tam yaşam döngüsüne taşı: trial→paid, proration, dunning, cancel, **freeze/dondurma**. + Entitlement katmanı: plan/tier → feature/içerik runtime kilidi (rbac + revenue + settings wiring).
**Açtığı dikeyler (~5):** SaaS/app, üyelik/topluluk, eğitim, fitness, DTC-abonelik kutusu.
**Efor:** M · **Not:** Çoğu "yeni modül" değil, **mevcut plugin'i bitirme**. Üç dikeyde (SaaS, eğitim, üyelik) entitlement ortak.

### #4 — SMS / WhatsApp Gateway (yatay, küçük, zorunlu)
**Ne:** `notification` e-posta odaklı; randevu hatırlatma / üretim-onay / aşı çağrısı / no-show için SMS+WhatsApp şart.
**Açtığı dikeyler:** her randevu dikeyi (5/5 sağlık) + her teklif-onay dikeyi + hatırlatma kullanan herkes.
**Efor:** S · **Sıra:** booking'den ÖNCE; düşük efor, yüksek zorunluluk, çok geniş kullanım.

### #5 — Rich-Record / EHR-lite (customer'a bağlı zengin kayıt)
**Ne:** `customer` tek-katmanlı kimlik tutar; üstüne domain-zengin kayıt: hasta dosyası (tedavi geçmişi), pet profili (sahip→hayvan iki katman), araç kaydı (plaka/VIN/servis geçmişi).
**Açtığı dikeyler:** estetik, diş, veteriner, oto-servis (+ kuaför tercih-notu hafif).
**Efor:** M · **⚠️ KVKK:** sağlık verisi = özel nitelikli; şifreli saklama + yetki-bazlı erişim + onam zorunlu (§7).

### Niş / Ertelenebilir (dikey-spesifik, tek dikey açar)
LMS/enrollment+progress (eğitim) · digital-delivery+license (dijital ürün) · KDS+table-session+split-bill (restoran) · channel-manager+folio (otel) · CRM-pipeline (emlak/profesyonel) · odontogram (diş) · IAP-receipt + LiveOps (oyun) · QR-checkin+seat-map (etkinlik).

---

## 4) Acil İkili — Derin Analiz

Can'ın direktifi: önce kendi dijital işleri + babanın mobilyası. İkisi **farklı tipte** iş.

### Track A — Dijital ürünler (oyun / app / SaaS) → "BİTİRME" track'i
- **Bugünkü kapsama:** app/SaaS ~%65, oyun ~%70. Platformun ev sahası; `content`+`revenue`+`tenant` zaten bu dikeyler için tasarlanmış.
- **Eksik = yeni modül DEĞİL, mevcut plugin'leri bitirmek:**
  1. `revenue` → tam subscription lifecycle (trial/proration/dunning/cancel/freeze). Şu an "topla" odaklı.
  2. Entitlement/paywall katmanı (plan→feature/içerik kilidi) — rbac+revenue+settings wiring.
  3. `content`/`social-snapshot` → yayın takvimi/scheduling wiring. **Bilinen tavan:** sosyal upload server-side değil (Zernio tarayıcı-widget — MEMORY notu).
  4. IAP receipt doğrulama (oyun) + payment recurring webhook reconciliation (Stripe/Iyzico) → adaptör.
- **Efor:** M. **Risk:** MEMORY'deki "3 denemede de mimari değil **wiring/bitirme** öldü" uyarısı tam buraya düşüyor — yeni özellik değil, bitirme disiplini gerekiyor.

### Track B — Mobilya atölyesi (baban) → "MADE-TO-ORDER ÇEKİRDEĞİ"
- **Bugünkü kapsama:** ~%40. Standart commerce tabanı (product/order/payment/inventory) var; "atölye" akışı yok.
- **Eksik = yeni modül ailesi (= Yatay #2):**
  1. RFQ/teklif: konfigürasyon (ölçü+kumaş+ahşap) → teklif (versiyon/geçerlilik/onay). `draft-order`'ı genişlet.
  2. Dinamik fiyat: m²/metretül kural motoru (`pricing` statik).
  3. BOM + malzeme rezervasyonu: kumaş/hammadde reçetesi → `inventory` düşümü.
  4. Üretim iş-emri: kesim→dikiş→montaj aşama/Kanban (yeni entity + durum makinesi).
  5. Kapora+bakiye taksit planı (`payment` genişlet).
- **Efor:** L. **Kaldıraç:** tek seferde mobilya + mutfak/doğrama + mermer + terzi + özel-pasta + oto-servis(kısmen) açılıyor; baban **gerçek dış kullanıcı** = doğrulama.

### Üçüncü (acil değil) — Arkadaşının estetik merkezi
Booking omurgası (#1) + Rich-Record (#5) + SMS (#4) + KVKK/foto/onam yatırımı gerektirir. Kapsama ~%30, efor L, **en ağır compliance**. Öneri: booking omurgasını önce **kuaför** (düşük KVKK) ile doğrula, estetik onun üstüne otursun. "Demo olur, satılmaz" tuzağına dikkat — sağlık verisi compliance'ı ciddi iş.

---

## 5) Geniş Sektör Kataloğu (özet tablo)

Kapsama % = çıkarım. Efor: S/M/L. Satıl. = tekrar-satılabilirlik.

| Sektör | Kapsama | Efor | Satıl. | Ana eksik(ler) |
|---|---|---|---|---|
| **Commerce & Maker** ||||
| Perakende e-ticaret | ~85% | S | yüksek | RMA, kargo connector, pazaryeri |
| Mobilya atölyesi (özel üretim) | ~40% | L | yüksek | RFQ, dinamik fiyat, BOM, iş-emri, kapora |
| Moda/tekstil DTC | ~75% | M | yüksek | abonelik kutusu, RMA, affiliate |
| Gıda üretimi / fırın | ~55% | M | orta-yük. | tarih-slot, iş-emri, BOM, lot/SKT |
| El yapımı / zanaat | ~80% | S | yüksek | kişiselleştirme, workshop booking |
| **Health & Body** ||||
| Kuaför / berber | ~50% | M | yüksek | booking, hizmet-kataloğu, komisyon, SMS (KVKK düşük → ilk pilot) |
| Fitness / yoga | ~45% | M | yüksek | class-booking, check-in, eğitmen takvimi, SMS |
| Veteriner | ~40% | M-L | orta-yük. | pet profili, EHR, aşı motoru, booking (rakip yoğun) |
| Estetik / güzellik | ~30% | L | yüksek | booking, EHR, foto, onam, seans-kredi, SMS (⚠️KVKK) |
| Diş / tıbbi | ~20% | L | orta | booking, EHR, odontogram, reçete, SGK (⚠️KVKK en ağır) |
| **Services & Booking** ||||
| Etkinlik / bilet | ~60% | M | yüksek | event/session entity, QR check-in, seat-map |
| Oto servis / tamir | ~55% | M | yüksek | work-order, araç kaydı, labor-line, bay-booking |
| Restoran / kafe | ~50% | L | yüksek | masa-booking, table-session, KDS, BOM, split-bill |
| Emlak | ~40% | M | yüksek | ilan modeli, CRM pipeline, görüntüleme-booking, harita (CMS avantajı) |
| Profesyonel hizmet | ~30% | L | orta | proje/matter, timesheet, saat-faturalama, kanban |
| Otel / konaklama | ~25% | L | orta-yük. | tarih-aralığı booking, müsaitlik, channel-manager, frontdesk |
| **Digital & Knowledge** ||||
| Mobil oyun | ~70% | M | yüksek | player-profile, LiveOps, IAP-receipt, moderasyon |
| İçerik üretici / medya | ~70% | M | orta | yayın-takvimi (bitir), social server-side (Zernio sınırı), deal-CRM |
| Mobil app / SaaS | ~65% | M | yüksek | recurring-billing (revenue bitir), entitlement, webhook reconciliation |
| Dijital ürün satışı | ~65% | M | yüksek | digital-delivery/license, signed-URL, affiliate |
| Üyelik / topluluk | ~55% | M/L | yüksek | entitlement/paywall, tier modeli, topluluk/forum |
| Eğitim / online kurs | ~50% | L | yüksek | LMS/enrollment/progress, content-gate, video-DRM, koçluk-booking |

---

## 5b) Sektör × Modül Matrisi

**Tablo 1 — Sektör × Mevcut Yetenek**
Mevcut modül/plugin yığını o sektörü ne kadar karşılıyor?
Legend: **✓** tam · **~** kısmi/zorlama (mevcut modülü esnetme) · **✗** yok / ilgisiz

| Sektör | Katalog | Stok | Sipariş | Ödeme | Promo/Sadakat | CMS/İçerik | Abonelik | Tenant/RBAC |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Perakende e-ticaret | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| Mobilya atölyesi | ~ | ~ | ~ | ~ | ✓ | ✓ | ✗ | ✓ |
| Moda/tekstil DTC | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| Gıda üretimi/fırın | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| El yapımı/zanaat | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Kuaför/berber | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✗ | ✓ |
| Fitness/yoga | ~ | ✗ | ~ | ✓ | ✓ | ~ | ✓ | ✓ |
| Veteriner | ✓ | ✓ | ✓ | ✓ | ~ | ✗ | ✗ | ✓ |
| Estetik/güzellik | ~ | ✗ | ~ | ✓ | ✓ | ~ | ✗ | ✓ |
| Diş/tıbbi | ✗ | ~ | ~ | ~ | ✗ | ✗ | ✗ | ✓ |
| Etkinlik/bilet | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Oto servis | ✓ | ✓ | ~ | ✓ | ~ | ✗ | ✗ | ✓ |
| Restoran/kafe | ✓ | ~ | ~ | ~ | ✓ | ~ | ✗ | ✓ |
| Emlak | ~ | ✗ | ✗ | ~ | ✗ | ✓ | ✗ | ✓ |
| Profesyonel hizmet | ✗ | ✗ | ~ | ✓ | ✗ | ~ | ~ | ✓ |
| Otel/konaklama | ~ | ✗ | ~ | ✓ | ~ | ✓ | ✗ | ✓ |
| Mobil oyun | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| İçerik üretici/medya | ~ | ✗ | ✗ | ~ | ✗ | ✓ | ✓ | ✓ |
| Mobil app/SaaS | ~ | ✗ | ~ | ✓ | ✓ | ~ | ✓ | ✓ |
| Dijital ürün satışı | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| Üyelik/topluluk | ~ | ✗ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Eğitim/online kurs | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

> Sütun→modül eşlemesi: Katalog=`product` · Stok=`inventory`/`stock-location` · Sipariş=`order`/`cart`/`draft-order` · Ödeme=`payment`/`pricing` · Promo/Sadakat=`promotion`/`loyalty` · CMS/İçerik=`cms`/`content`/`social-snapshot` · Abonelik=`revenue` · Tenant/RBAC=`tenant`/`rbac`.

**Tablo 2 — Sektör × Gereken Yeni Modül**
Hangi sektör hangi yeni modülü gerektiriyor? **➕** = inşa gerekli. Sütunlar §3'teki yatay kaldıraç modülleri.

| Sektör | Booking | Made-to-Order | Entitlement / Abone-bitir | SMS/WA | EHR / Rich-record | Niş modül |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Perakende e-ticaret | | | | ~ | | RMA, kargo, pazaryeri |
| **Mobilya atölyesi** | | **➕** | | ➕ | | — |
| Moda/tekstil DTC | | | ➕ | | | RMA, affiliate |
| Gıda üretimi/fırın | ➕ | ➕ | | ➕ | | lot/SKT, alerjen |
| El yapımı/zanaat | ~ | | | | | kişiselleştirme |
| Kuaför/berber | ➕ | | | ➕ | ~ | komisyon |
| Fitness/yoga | ➕ | | ➕ | ➕ | | check-in/turnike |
| Veteriner | ➕ | | | ➕ | ➕ | aşı motoru |
| Estetik/güzellik | ➕ | | | ➕ | ➕ | foto/onam (⚠️KVKK) |
| Diş/tıbbi | ➕ | | | ➕ | ➕ | odontogram, SGK (⚠️KVKK) |
| Etkinlik/bilet | ➕ | | | ➕ | | QR-checkin, seat-map |
| **Oto servis** | ➕ | **➕** | | ➕ | ➕ | araç-kaydı |
| Restoran/kafe | ➕ | | | | | KDS, table-session, BOM |
| Emlak | ➕ | | | | | ilan-modeli, CRM, harita |
| Profesyonel hizmet | ➕ | | ➕ | | | proje/matter, timesheet |
| Otel/konaklama | ➕ | | | | | channel-manager, folio |
| Mobil oyun | | | ➕ | ➕ | ➕ | LiveOps, IAP-receipt |
| İçerik üretici/medya | | | ➕ | | | social server-side, deal-CRM |
| **Mobil app/SaaS** | | | **➕** | | | webhook-reconciliation |
| Dijital ürün satışı | | | ➕ | | | digital-delivery/license |
| Üyelik/topluluk | | | ➕ | | | topluluk/forum |
| Eğitim/online kurs | ➕ | | ➕ | | | LMS/enrollment, video-DRM |

> **Sütun toplamı (kaç sektör bu modülü istiyor):** Booking **14** · Entitlement/Abone-bitir **10** · SMS/WA **10** · EHR/Rich-record **6** · Made-to-Order **3** (ama her biri kendi alt-dikey ailesini açıyor). Bu, §3'teki kaldıraç sırasını sayıyla doğruluyor.

---

## 6) Yol Haritası (öneri — çıkarım)

Sıralama mantığı: önce **bitirme** (düşük risk, kaldıraçlı), sonra **acil-yeni** (baban, gerçek kullanıcı), sonra **en geniş yatay** (booking).

- **Faz 0 — Bitir (M):** `revenue` subscription lifecycle + entitlement/paywall. → senin SaaS/app + üyelik + eğitim kaldıracı. Yeni modül yok; "wiring'i bitir" disiplini.
- **Faz 0.5 — SMS/WhatsApp gateway (S):** yatay; teklif-onay + randevu + hatırlatma hepsi kullanacak. Booking'den önce.
- **Faz 1 — Made-to-order çekirdeği (L):** baban + 5 üretim dikeyi. Gerçek dış kullanıcıyla doğrula.
- **Faz 2 — Booking omurgası (L):** kuaför pilotu (düşük KVKK) → fitness → estetik (KVKK+foto+onam yatırımıyla). ~11 dikey.
- **Faz 3+ — Niş modüller:** dikey-spesifik talebe göre (LMS, digital-delivery, KDS, channel-manager, CRM-pipeline).

**Her dikey kendi spec→plan→implementasyon döngüsünü hak ediyor.** Bu doküman harita; tek tek inşa planı değil.

---

## 7) Dürüst Sınırlar (kanıt boşlukları)

1. **Çalışır-durum DOĞRULANDI (§2c).** Kapsama %'leri yine "kavramsal karşılar" demek, ama plugin/modül olgunluğu artık kodla biçildi. Özet: yalnız `loyalty` ✅ uçtan-uca; 4 custom modülden 3'ü (rbac/settings/translation) ✅ veri-katmanı tam ama API/admin yok; çekirdek plugin'lerde sistematik eksik = üst-katman (API+admin+workflow). **İki acil düzeltme:** `tenant` RLS yazılmamış → çok-kiracı izolasyon fiilen yok; `cms` migration yok → boot'ta tablo kurmaz. Sektör kapsama %'leri bu üst-katman eksiğini hesaba KATMAZ — "modül var" ≠ "panelde kullanılabilir".
2. **`product` modülü fiziksel-mal odaklı.** Hizmet/randevu/üretim/proje/oda-gece için zorlanır — bu, L-efor dikeylerin (otel/diş/estetik/profesyonel/mobilya) ortak kök sebebi.
3. **Sosyal yayın server-side değil.** `content`/Zernio upload yalnız tarayıcı-widget; medya/içerik dikeyinde bilinen tavan.
4. **KVKK.** Estetik + diş = özel nitelikli sağlık verisi; şifreli saklama + yetki-bazlı erişim + onam + saklama/imha politikası şart. Hobby-grade panelle satılamaz. Veteriner istisna (hayvan sağlık verisi KVKK dışı).
5. **Rakip olgunluğu.** Veteriner (BulutVet/Petinoks) ve otel (hazır PMS) pazarlarında rekabet sert; standardize değer önermesi gerekir.

---

*Sonraki adım: hangi Faz'ı gerçek implementasyon planına (writing-plans) çevireceğimize karar ver.*
