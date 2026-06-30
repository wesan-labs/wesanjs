# pricing — Fiyatlandırma (fiyat setleri, listeler, bölge/para bazlı fiyat)   [✅ upstream Medusa]

## Ne yapar
Bir varyantın fiyatını bağlama (para birimi, bölge, müşteri grubu, miktar) göre hesaplar. Fiyat mantığını üründen ayırır.

## Ana modeller / kavramlar
- **PriceSet** — bir varlığa (genelde varyant) bağlı fiyatlar kümesi
- **Price** — tek bir fiyat kaydı (tutar + para birimi + kurallar)
- **PriceList** — kampanya/indirim/override fiyat listesi (sale, override tipleri)
- **PriceRule** — fiyatı koşula bağlayan kural (region_id, customer_group vb.)
- **Miktar kademesi** — `min_quantity` / `max_quantity` ile hacim fiyatı

## Public yüzey (özet)
`calculatePrices` (bağlama göre en uygun fiyatı seçer), `createPriceSets`, `addPrices`, fiyat listesi CRUD'ları. Çekirdek metot `calculatePrices` — context'e göre best-match fiyat döner.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
