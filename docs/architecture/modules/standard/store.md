# store — Mağaza genel yapılandırması   [✅ upstream Medusa]

## Ne yapar
Mağazanın genel ayarlarını (ad, varsayılan para birimi, varsayılan bölge vb.) saklar ve yönetir.

## Ana modeller / kavramlar
- **Store** — mağaza temel yapılandırması (name, default_currency_code, default_region_id, metadata).

## Public yüzey (özet)
`retrieveStore`, `updateStore`, `listStores`, `createStore`.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
Çok-kiracılı (SaaS) platform yapısında her kiracının (tenant) kendi `Store` kaydı bulunur, tenant-store bağıntısı link modülleriyle kurulur.
