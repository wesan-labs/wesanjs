# customer — Müşteri yönetimi (profil, adres, müşteri grupları)   [✅ upstream Medusa]

## Ne yapar
Mağazaya kayıtlı veya anonim müşterileri, adres defterlerini ve pazarlama/fiyatlandırma segmentasyonu için kullanılan müşteri gruplarını yönetir.

## Ana modeller / kavramlar
- **Customer** — müşteri profili (email, first_name, last_name, phone, metadata).
- **CustomerAddress** — müşteri adres defterindeki kayıtlar (adres satırları, ülke, ilçe, posta kodu).
- **CustomerGroup** — müşterilerin gruplanması (örn. `VIP`, `B2B`).

## Public yüzey (özet)
`createCustomers`, `updateCustomers`, `retrieveCustomer`, `listCustomers`, müşteri grupları yönetimi ve adres CRUD operations.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
Çok-kiracılı (multi-tenant) yapıda müşterilerin kiracı bazlı izolasyonu (tenant_id) veya ortak müşteri havuzları yönetimi, `tenant` entegrasyonuyla şekillendirilecektir.
