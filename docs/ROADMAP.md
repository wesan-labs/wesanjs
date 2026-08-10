# Yol haritası — nereden, nasıl, ne zaman bitmiş sayılır

> Bu doküman **sırayı** tutar. Görevlerin detayı [tasks/](tasks/README.md)'de, kararlar
> [adr/](adr/)'de, iş modeli [PLATFORM-MODEL-SPEC](specs/PLATFORM-MODEL-SPEC.md)'te.
> Burada sadece: hangi adım, neden o sırada, bittiğini nasıl anlarız.

---

## 0. Hedef — iki gerçek kullanıcı

Platform soyut bir "SaaS" olarak değil, **iki somut kurulumla** doğrulanacak:

1. **Kendi panelimiz** — oyun/uygulama analitiği (AdMob · RevenueCat · sosyal). Ticaret **değil**.
2. **begahome** — babanın atölyesinin mobilya mağazası (gerçek işletme, gerçek ürünler). Tek commerce tenant.

▎Bu, hayali müşteri beklemekten çok daha iyi bir doğrulama yolu. Gerçek veri, gerçek kullanım,
sıfır ticari risk. Platformun çalıştığını A4'ü (kayıt/ödeme) beklemeden kanıtlarsın.

**Ama bir bedeli var** — aşağıdaki §2'ye bak.

---

## 1. Şimdi: üç küçük iş (1–2 gün)

Zemin temizliği. Hiçbiri mimari değil, hepsi risk kapatıyor.

| # | İş | Neden | Bitti sayılır |
| :-- | :--- | :--- | :--- |
| 0.1 | `helm/` klasörünü git'e al | Backend ayarları ve 26 env anahtarı hiçbir yerde versiyonlanmıyor; silinirse geri dönüş yok | `helm/` git'te, `.env` ignore'lu, `.env.example` var |
| 0.2 | 2 veritabanı güncellemesini uygula | Medusa 2.18 ile gelen product indeksleri `helm` DB'sine işlenmedi | `db:migrate` temiz geçiyor, tablo indeksleri yerinde |
| 0.3 | Bayat dalları sil | `origin/beta` (75 geride) ve `origin/feat/mail-plugin` (16 geride) karışıklık yaratıyor | GitHub'da sadece `wesan` + `main` + `develop` |

---

## 2. Çekirdek tenant izolasyonu — **ertelendi, bloke etmiyor**

> **Karar (2026-08-10):** Bu kapı şimdilik açılmıyor. Gerekçe aşağıda.
> Durak 1'e doğrudan geçilebilir.

**Neden ertelenebilir:** İki kurulumun kullandığı tablolar ayrışıyor.

```
Kendi panelimiz — oyun/uygulama analitiği
  revenue_app · revenue_source · revenue_event · revenue_metric_snapshot
  revenue_expense · analytics_metric_snapshot · social_snapshot     → 7/7 tenant_id ✅

begahome — ticaret
  product · order · customer                                        → tenant_id ❌
```

Kendi panelimiz ticaret tablolarına **hiç dokunmuyor**. begahome ise tek commerce tenant.
Tek sahibi olan tabloda çapraz-tenant sızıntısı olmaz.

**⚠️ Kapının tetikleyicisi:** *ikinci bir commerce tenant*. (Örn. ileride giyim dikeyi.)
O gün gelmeden önce aşağıdaki deney çalıştırılmış ve karar verilmiş olmalı.

**Araştırma sonucu — "Store Module" yolu ELENDI:**

| Varlık | Medusa'nın yerel kapsamı | Sorun |
| :--- | :--- | :--- |
| `product` | `product_sales_channel` (çoka-çok) | Görünürlük listesi, sahiplik değil |
| `order` · `cart` | `sales_channel_id` | Sınır olarak çalışır |
| `customer` | **yok** | Müşteriler tamamen ortak — KVKK'ya aykırı |
| `store` | 8 alan, başka modüle link'i **yok** | Ayar kabı, tenant sınırı değil |

`customer` tek başına bu yolu bitiriyor.

**Kalan iki alt-yol — deneyle seçilecek:**

| | Nasıl | Merge maliyeti | Bilinmeyen |
| :--- | :--- | :--- | :--- |
| **B1** | Sadece migration: kolon + `DEFAULT current_setting('app.current_tenant_id')` + RLS. Model dosyasına dokunulmaz. | **Sıfır** | MikroORM bilmediği kolona tahammül eder mi? `db:generate` düşürmek ister mi? |
| **B2** | Upstream model dosyalarına alan ekle | Her Medusa sürümünde çakışma | Yok |

**Deney (yarım gün, canlı veriye dokunmadan):** kopya DB → tek tablo (`product`) → B1 uygula →
dört soruyu test et: ① tenant_id doluyor mu ② çapraz-tenant okuma engelleniyor mu
③ `db:migrate` kolonu koruyor mu ④ `db:generate` düşürmek istiyor mu.
Dördü temizse B1, değilse B2 — ama maliyeti bilerek.

**Yan iş:** RLS rolü adları `levios_app` / `levios_platform` (39 referans), levios döneminden kalma.
Çekirdeğe yayılmadan önce değiştirmek ucuz; sonra pahalı.

Bugünkü durum ([#0005](tasks/0005-tenant-id-rls-rollout.md)):

```
tenant_id + RLS  ✅ revenue · cms · content   (kendi eklentilerimiz)
tenant_id + RLS  ❌ Medusa core: ürün · sipariş · müşteri
```

**Sonuç:** İki mağaza açarsan ürün katalogları birbirini görür. begahome'un 107 ürünü ile
kendi panelinin verisi aynı havuzda.

**Karar verilmemiş iki yol var** (#0005'te yazılı):

| Yol | Nasıl | Artı | Eksi |
| :--- | :--- | :--- | :--- |
| **A — Store Module** | Medusa'nın kendi `store_id`'sini tenant anahtarı yap | Medusa'nın kendi mekanizması; upstream'le kavga yok | Medusa'nın store kavramı tam tenant değil; sınırları test edilmeli |
| **B — RLS** | Core tablolara `tenant_id` + RLS ekle | Diğer modüllerle aynı desen, tutarlı | Core tablolara dokunmak = her Medusa merge'ünde çakışma riski |

▎**Benim okumam:** A'yı ciddi araştır. B, core tablolara dokunduğu için her upstream merge'ünde
bize acı verir — dün 2.17→2.18 merge'ünde ayak izimiz küçük olduğu için 6 çakışmayla kurtulduk.
Core şema değişirse o rakam büyür. Ama karar araştırmadan verilmez.

**Kaçış kapısı:** Eğer "kendi panelim" bir *mağaza* değil de platformun kendi yönetim paneliyse,
o zaman ortada **tek commerce tenant** (begahome) var ve bu kapı henüz açılmıyor. Bu durumda
karar A4'e ertelenebilir. **Netleştirilmesi gereken ilk şey bu.**

**Bitti sayılır:** ADR yazıldı (A mı B mi), gerekçesi kanıtla desteklendi, #0005'in kalan maddesi
o karara göre güncellendi.

---

## 3. Durak 1 — Güvenlik duvarını aç
> [#0014](tasks/0014-security-baseline.md) · ADR-0004'te "A1"

**Sorun:** Çok-müşterili yapı var ama veritabanı seviyesindeki koruma **kapalı**. RLS politikaları
yazılmış, ama oturuma "sen sadece şu müşterinin verisini görebilirsin" diyen komut (`set_config`)
hiç çağrılmıyor. Yani bugün korumayı sağlayan tek şey, kodun her yerde doğru yazılmış olması.
Bir yerde filtre unutulursa sızıntı olur.

**Yapılacak:**
- İstek geldiğinde veritabanı oturumuna tenant kimliğini bas (`set_config`)
- Aynısını **arka plan işleri için de** yap — kuyruğa giren her iş tenant bilgisi taşımalı
  ([ADR-0005](adr/0005-background-jobs-queue-worker.md) K4)

**Bitti sayılır:**
- İki tenant açılır, biri diğerinin verisini **hiçbir uçtan** göremez ([#0009](tasks/0009-tenant-isolation-proof.md) kanıt scripti)
- Aynı kanıt arka plan işleri için de geçer
- Kanıt scripti CI'da koşar (regresyon)

---

## 4. Durak 2 — Kim neyi aldı, ne kadar kullandı
> [#0006](tasks/0006-entitlements-composable-panel.md) · "A2"

**Sorun:** Sistem "bu müşteri hangi paketi aldı" bilmiyor. "Bu ay kaç görsel üretti" de bilmiyor.

**Yapılacak:** İki şey —
1. **Hak tablosu:** hangi tenant hangi sete/yeteneğe erişebilir. Sidebar bunu okuyup filtreler.
2. **Kullanım sayacı:** AI işlemleri operasyon bazında sayılır.

**Neden burada:** Ek paket satmak bunsuz imkânsız. Ne erişimi kısıtlayabilirsin, ne kullanımı
faturalandırabilirsin. Ayrıca [PLATFORM-MODEL §3](specs/PLATFORM-MODEL-SPEC.md)'teki "AI düz
abonelikle satılmaz, kredi ile satılır" kuralının teknik karşılığı sayaçtır.

**Bitti sayılır:**
- Bir tenant'ın hakkı kapatılınca ilgili menü kayboluyor **ve** API'si 403 dönüyor (sadece UI değil)
- Bir AI işlemi çalıştığında sayaç artıyor, limit dolunca iş reddediliyor

---

## 5. Durak 3 — begahome'u gerçekten kur
> Yeni adım — ADR-0004'te yok

Bu, planın kalanını doğrulayan adım. İlk iki durak bitince begahome'u **gerçek tenant olarak** aç.

**Yapılacak:**
- begahome'un ürün verisini taşı (kataloglar repoda: 81 + 26 tanım; fiyat/varyant/görsel begahome DB'sinde)
- Mobilya sektör setini uygula
- Panelden gerçek işlem yap

**Neden burada:** Durak 1 ve 2'nin gerçekten çalıştığını **gerçek veriyle** kanıtlar. Sentetik test
tenant'ı yerine gerçek katalog. Ayrıca ikinci sektör setini yazarken elinde çalışan bir örnek olur.

**Bitti sayılır:** begahome'un ürünleri panelde, doğru tenant'ta, kendi panelinden görünmüyor.

---

## 6. Durak 4 — WhatsApp'tan satış
> Öneri ("A3.5") — **karar verilmedi**

**Yapılacak:** `wesan-labs/levios` deposundaki WhatsApp ve Instagram satış modüllerini buraya taşı.
Kaynak var: `packages/modules/whatsapp-commerce`, `instagram-commerce` + business provider'ları.

**Neden:** TR'de bu panel "Medusa'nın Türkçesi" olarak satılmaz. WhatsApp'tan sipariş alabilmesi
seni Shopify'dan ayıran şey. Ve begahome (mobilya) tam olarak WhatsApp'tan satılan bir kategori —
yani ilk gerçek kullanıcın bu yeteneği hemen kullanır.

**Alternatifi:** ADR-0004 burada "ikinci sektör seti" diyor. Sektör seti = aynı ürünü başka dikeye
satmak. Satış kanalı = ürünü rakipten ayırmak. **Senin kararın.**

**Bitti sayılır:** begahome'a WhatsApp'tan bir sipariş düşüyor ve panelde görünüyor.

---

## 7. Durak 5 — Kayıt ol, panelin hazır olsun
> "A4"

**Sorun:** Dışarıdan kimse kayıt olamıyor; sadece var olan bir kullanıcı üye olarak eklenebiliyor.

**Yapılacak:** Kayıt/davet akışı + provisioning workflow (tenant yarat → hak satırları → set seed'i).

**Neden en son:** Buraya kadar hiçbir şey dışarıdan müşteri alamaz. İlk gelir burada başlar.
Ama Durak 3 sayesinde platformun çalıştığını çoktan biliyor olacaksın.

**Bitti sayılır:** Sıfırdan kayıt olan biri, elle müdahale olmadan çalışan bir panele kavuşuyor.

---

## 8. Sonrası — B fazı

Mağaza vitrini (çok-kiracılı storefront), pazaryeri entegrasyonları, e-fatura, kargo, yerel ödeme.
Detay: [PLATFORM-MODEL §5](specs/PLATFORM-MODEL-SPEC.md).

begahome'un **sitesi** de bu fazda. Durak 3'te panelini kuruyoruz, vitrinini değil.

---

## 9. Disiplin — bu üçüncü deneme

Aynı panelin daha önce iki denemesi oldu (nexpaces, old-levios). İkisi de **mimari yüzünden değil,
kapsam büyümesinden** öldü. Her seferinde yeni katman eklendi, hiçbiri bitmedi.

**Kurallar:**
1. **Bir seferde bir durak.** Durak bitmeden sonrakine geçilmez.
2. **"Bitti sayılır" yazılmadan iş başlamaz.** Yukarıdaki her durakta var; yeni iş eklenirse o da yazılır.
3. **Şu an listede olmayan her şey ertelenir:**
   - npm paketi yayınlama → Durak 5'ten sonra
   - begahome kod göçü → hiç (sadece veri, Durak 3)
   - storefront → B fazı
   - fiyat kartı → gerçek maliyet ölçülünce
   - Tailwind v4, geo-viz, chart kit → backlog
4. **Kaynak kodda `@medusajs` yeniden adlandırılmaz.** Gerekçe:
   [PLATFORM-MODEL §4.1](specs/PLATFORM-MODEL-SPEC.md) — levios bunu yaptı ve 2.13.1'de dondu.
5. **Upstream senkronu düzenli.** Ne kadar beklersen merge o kadar acır.

---

## 10. Şu an açık olan kararlar

| # | Karar | Neyi bloke ediyor |
| :-- | :--- | :--- |
| ~~1~~ | ~~"Kendi panelim" mağaza mı?~~ | **Kapandı (2026-08-10):** analitik paneli, ticaret değil → §2 ertelendi |
| 2 | Çekirdek izolasyon B1 mi B2 mi? | Hiçbir şeyi — ama ikinci commerce tenant'tan **önce** deney koşulmalı |
| 3 | Durak 4: WhatsApp mı, ikinci sektör seti mi? | Durak 4'ün içeriği |
| 4 | ADR-0005 "Önerildi" → "Kabul" olacak mı? | Yok (uygulandı, çalışıyor) |
| 5 | RLS rol adları `levios_*` yeniden adlandırılsın mı? | Yok — ama çekirdeğe yayılmadan yapılmalı |

---

## 11. İlgili

[ADR-0001](adr/0001-multi-tenancy.md) · [ADR-0004](adr/0004-product-sequence-composable-panel.md) ·
[ADR-0005](adr/0005-background-jobs-queue-worker.md) ·
[PLATFORM-MODEL-SPEC](specs/PLATFORM-MODEL-SPEC.md) · [SECTOR-SETS-SPEC](specs/SECTOR-SETS-SPEC.md) ·
[tasks/](tasks/README.md)
