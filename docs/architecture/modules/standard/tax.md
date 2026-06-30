# tax — Vergi kuralları ve hesaplama motoru   [✅ upstream Medusa]

## Ne yapar
Ürünlerin veya gönderim yöntemlerinin vergi oranlarını coğrafi bölgelere göre yönetir ve sepet satırları için toplam vergi tutarlarının hesaplanmasını sağlar.

## Ana modeller / kavramlar
- **TaxRate** — vergi oranı tanımı (rate, code, name, metadata).
- **TaxRegion** — coğrafi vergi bölgesi (country_code, province_code, parent_id).

## Public yüzey (özet)
`createTaxRates`, `listTaxRates`, `calculateTax` (verilen kalemler ve bağlam için vergi hesaplamasını gerçekleştirir).

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
