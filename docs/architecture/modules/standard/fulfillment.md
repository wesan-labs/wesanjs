# fulfillment — Teslimat yöntemi ve kargo yönetimi   [✅ upstream Medusa]

## Ne yapar
Siparişlerin gönderim ve teslimat süreçlerini yönetir. Kargo sağlayıcılarını (Local, FedEx, UPS vb.), kargo ücret kurallarını, bölgelere göre teslimat seçeneklerini ve paket takibini (tracking) kontrol eder.

## Ana modeller / kavramlar
- **Fulfillment** — teslimat süreci kaydı (tracking_numbers, shipped_at, delivered_at, canceled_at).
- **ShippingOption** — müşteriye sunulan kargo seçeneği (name, price_type: `flat` | `calculated`, amount).
- **FulfillmentProvider** — entegre edilen kargo entegrasyonu sağlayıcısı.
- **ShippingProfile** — farklı ürün grupları için gönderim kuralları profili.

## Public yüzey (özet)
`createFulfillments`, `cancelFulfillment`, `createShippingOptions`, `retrieveFulfillment`, kargo fiyat hesaplama ve gönderi oluşturma workflows.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
