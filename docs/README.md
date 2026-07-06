# wesanjs Modül & Plugin Mimari Dokümantasyonu

Bu dizin, **wesanjs** SaaS panel platformunun modüler mimarisini, veri modellerini ve servis sınırlarını kod düzeyindeki kanıtlara dayalı olarak listeler.

Detaylı pazar analizi, sektör kaldıraç matrisi ve yol haritası için: [Sektör × Modül Haritası](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/research/2026-06-29-sector-module-map.md)

**Ana mimari doküman (ürün + 4 modül + plugin sözleşmesi):** [levios-platform-architecture.md](architecture/levios-platform-architecture.md)

---

## Mimari Özet ve Kavram Ayrımı

Medusa v2 katman mimarisi şu akışı izler:
`Module (Veri/CRUD) ──> Workflow (Mutasyon/Rollback) ──> API Route (HTTP) ──> Admin/Frontend UI`

*   **Modül (Module):** Tek bir iş alanından sorumlu, veri modelleri, CRUD servis metotları, migration ve repository içeren bağımsız birimdir. HTTP katmanı veya UI barındırmaz. Diğer modüllerle doğrudan konuşmaz, **Module Link** ile bağlanır.
*   **Plugin:** Bir veya birden fazla **modülü**, HTTP API rotalarını, admin panel bileşenlerini (UI), cron işlerini (jobs) ve mutasyon akışlarını (workflows) bir araya getirip projeye komple kurulabilir paket haline getiren bohçadır.

**Kontrol düzlemi vs feature plugin:** `tenant` teknik olarak bir plugin paketidir ama mimari olarak **feature değildir** — tüm katmanları dikey kesen platform omurgasıdır (izolasyon, kimlik, üyelik). Admin UI'da Settings altında **Organization / Team** olarak durur; sidebar feature listesinde yer almaz. Bkz. [Kontrol Düzlemi](architecture/control-plane.md).

---

## 0. Platform Omurgası (Control Plane)

Yatay katman — feature plugin'lerin ve commerce modüllerinin **üstünde** scope + kimlik + izolasyon sağlar.

| Durum | Birim | Tek Satır Özet | Dosya Linki |
| :---: | :--- | :--- | :--- |
| 🟡 | `tenant` | Multi-tenant omurga: Tenant + Membership + context middleware + RLS | [tenant.md](architecture/plugins/tenant.md) |
| 🟡 | `rbac` | Per-tenant rol/policy (model ✅, enforcement 🔴) | [rbac.md](architecture/modules/custom/rbac.md) |
| 🔮 | `entitlement` | Plan + feature gate + modül mağazası runtime | [entitlement.md](architecture/planned/entitlement.md) |

**Karar:** [ADR-0001 — Multi-tenancy](adr/0001-multi-tenancy.md) · [ADR-0002 — Analytics engine + observability shell](adr/0002-analytics-engine-observability-shell.md) (BYOK kısmı superseded) · **[ADR-0003 — Hosted vertical analytics](adr/0003-hosted-vertical-analytics.md)** · **Platform mimarisi:** [levios-platform-architecture.md](architecture/levios-platform-architecture.md) · **Analytics:** [observability.md](architecture/plugins/observability.md) · **Engine:** [analytics.md](architecture/modules/custom/analytics.md)

```
tenant_id + RLS ──► cms · revenue · content · loyalty · … · commerce core
```

---

## 1. Feature Plugin'ler (Packages / Plugins)

| Durum | Adı | Tek Satır Özet | Dosya Linki |
| :---: | :--- | :--- | :--- |
| ✅ | `loyalty` | Hediye kartı + store-credit (dijital cüzdan) sistemi | [loyalty.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/plugins/loyalty.md) |
| 🟡 | `revenue` | RevenueCat ve AdMob abonelik/reklam geliri agregasyonu | [revenue.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/plugins/revenue.md) |
| 🟡 | `content` | AI içerik stüdyosu + sosyal medya metrik snapshot | [content.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/plugins/content.md) |
| 🟡 | `cms` | Çok-siteli içerik (site/collection/entry) draft/publish | [cms.md](architecture/plugins/cms.md) |
| 🟡 | `mail` | Stalwart-backed personel e-posta kutusu yönetimi | [mail.md](architecture/plugins/mail.md) |
| 🔴 | `observability` | Hosted vertical analytics — PostHog + GlitchTip, `/analytics` UI (ADR-0003) | [observability.md](architecture/plugins/observability.md) |
| 🔴 | `draft-order` | Admin panelden müşteri adına taslak sipariş oluşturma (sadece UI) | [draft-order.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/plugins/draft-order.md) |

---

## 2. Özel Modüller (Packages / Modules / Custom)

| Durum | Adı | Tek Satır Özet | Dosya Linki |
| :---: | :--- | :--- | :--- |
| ✅ | `rbac` | Rol-bazlı yetkilendirme (rol/policy/hiyerarşi) | [rbac.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/custom/rbac.md) |
| ✅ | `settings` | Admin panel tablosu görünüm ve kullanıcı tercihleri | [settings.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/custom/settings.md) |
| ✅ | `translation` | Çoklu-dil translatable şema ve çeviri deposu | [translation.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/custom/translation.md) |
| 🟡 | `analytics` | Hosted vertical analytics **engine** (snapshot, bootstrap, PostHog/GlitchTip sync) | [analytics.md](architecture/modules/custom/analytics.md) |

---

## 3. Standart Medusa Modülleri (Packages / Modules / Standard)

| Durum | Adı | Tek Satır Özet | Dosya Linki |
| :---: | :--- | :--- | :--- |
| ✅ | `product` | Ürün kataloğu (varyant, opsiyon, koleksiyon, kategori) | [product.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/product.md) |
| ✅ | `pricing` | Fiyatlandırma (fiyat setleri, kurallar, kademeler) | [pricing.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/pricing.md) |
| ✅ | `inventory` | Stok kalemleri, seviyeleri ve rezervasyonlar | [inventory.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/inventory.md) |
| ✅ | `stock-location` | Fiziksel depo konumları ve stok merkezleri | [stock-location.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/stock-location.md) |
| ✅ | `order` | Sipariş (kalem, edit, iade/değişim, claim, taslak) | [order.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/order.md) |
| ✅ | `api-key` | API anahtarları (Publishable / Secret) yönetimi | [api-key.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/api-key.md) |
| ✅ | `auth` | Kimlik doğrulama ve oturum yönetimi | [auth.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/auth.md) |
| ✅ | `cart` | Sepet yönetimi (sepet, adresler, satır kalemleri) | [cart.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/cart.md) |
| ✅ | `currency` | Para birimi tanımları | [currency.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/currency.md) |
| ✅ | `customer` | Müşteri yönetimi (profil, adres, müşteri grupları) | [customer.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/customer.md) |
| ✅ | `file` | Dosya ve medya saklama soyutlaması | [file.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/file.md) |
| ✅ | `fulfillment` | Teslimat yöntemi ve kargo yönetimi | [fulfillment.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/fulfillment.md) |
| ✅ | `index` | Modüller arası arama ve sorgu motoru | [index.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/index.md) |
| ✅ | `link-modules` | Modüller arası ilişkileri (Module Links) yöneten altyapı | [link-modules.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/link-modules.md) |
| ✅ | `locking` | Dağıtık kilit yönetimi | [locking.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/locking.md) |
| ✅ | `notification` | Bildirim gönderimi ve şablon yönetimi | [notification.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/notification.md) |
| ✅ | `payment` | Ödeme işlemleri (oturum, capture, refund) | [payment.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/payment.md) |
| ✅ | `promotion` | Kampanyalar, kuponlar ve indirim kuralları | [promotion.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/promotion.md) |
| ✅ | `providers` | Modül sağlayıcı entegrasyonlarının yönetimi | [providers.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/providers.md) |
| ✅ | `region` | Coğrafi bölgeler (ülke, para birimi, vergi/kargo kuralları) | [region.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/region.md) |
| ✅ | `sales-channel` | Satış kanalları (B2B, Web, Mobil vb.) | [sales-channel.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/sales-channel.md) |
| ✅ | `store` | Mağaza genel yapılandırması | [store.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/store.md) |
| ✅ | `tax` | Vergi kuralları ve hesaplama motoru | [tax.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/tax.md) |
| ✅ | `user` | Admin personeli ve kullanıcı yönetimi | [user.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/user.md) |
| ✅ | `cache` | Önbellek yönetimi (inmemory / redis / caching) | [cache.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/cache.md) |
| ✅ | `event-bus` | Olay yayını ve asenkron haberleşme (local / redis) | [event-bus.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/event-bus.md) |
| ✅ | `workflow-engine` | İş akışları ve mutasyon yönetimi | [workflow-engine.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/modules/standard/workflow-engine.md) |

---

## 4. Planlanan Modüller (Planned)

| Durum | Adı | Tek Satır Özet | Dosya Linki |
| :---: | :--- | :--- | :--- |
| 🔮 | `booking` | Rezervasyon ve takvim omurgası | [booking.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/booking.md) |
| 🔮 | `made-to-order` | Sipariş üzerine üretim ve iş-emri çekirdeği | [made-to-order.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/made-to-order.md) |
| 🔮 | `entitlement` | Yetkilendirme ve limit/paywall katmanı | [entitlement.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/entitlement.md) |
| 🔮 | `sms-gateway` | SMS ve WhatsApp bildirim geçidi | [sms-gateway.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/sms-gateway.md) |
| 🔮 | `rich-record` | Zengin müşteri domain kaydı (EHR-lite) | [rich-record.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/rich-record.md) |
| 🔮 | `lms` | Eğitim ve kurs yönetim sistemi | [lms.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/lms.md) |
| 🔮 | `digital-delivery` | Dijital ürün teslimatı ve lisans anahtar sistemi | [digital-delivery.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/digital-delivery.md) |
| 🔮 | `rma` | İade yetkilendirme ve müşteri iade portalı | [rma.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/rma.md) |
| 🔮 | `crm` | Potansiyel müşteri ve teklif boru hattı (sales pipeline) | [crm.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/crm.md) |
| 🔮 | `restaurant-ops` | Restoran masa oturumları ve mutfak ekranı (KDS) | [restaurant-ops.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/restaurant-ops.md) |
| 🔮 | `hotel-pms` | Otel oda/rezervasyon ve geceleme envanter sistemi | [hotel-pms.md](file:///Users/canakyuz/Developer/wesan/levios/wesanjs/docs/architecture/planned/hotel-pms.md) |
