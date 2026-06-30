# cart — Sepet yönetimi (sepet, adresler, satır kalemleri)   [✅ upstream Medusa]

## Ne yapar
Müşterilerin alışveriş sepetlerini, sepete eklenen ürün varyantlarını (satır kalemlerini), fatura ve teslimat adreslerini yönetir. Vergi, promosyon ve gönderim hesaplamalarının sepet üzerinde uygulanması için gerekli alt yapıyı sağlar.

## Ana modeller / kavramlar
- **Cart** — sepet başlığı (email, currency_code, region_id, customer_id).
- **LineItem** — sepet satır kalemi (quantity, unit_price, title, thumbnail).
- **CartAddress** — sepete bağlı kargo veya fatura adresi.
- **CartShippingMethod** — sepete seçilen kargo seçeneği.

## Public yüzey (özet)
`createCarts`, `updateCarts`, `retrieveCart`, `listCarts`, line item ekleme/çıkarma/güncelleme metodları, adres ve shipping method atama API'leri.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
