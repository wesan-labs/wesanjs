# stock-location — Fiziksel stok/depo konumları   [✅ upstream Medusa]

## Ne yapar
Stoğun fiziksel olarak bulunduğu depo/mağaza konumlarını tanımlar. Inventory ve fulfillment modülleri bu konumlara dayanır.

## Ana modeller / kavramlar
- **StockLocation** — depo/mağaza konumu (ad, adres)
- **StockLocationAddress** — konumun adres bilgisi

## Public yüzey (özet)
`createStockLocations`, `updateStockLocations`, `listStockLocations`, adres yönetimi. Inventory seviyeleri ve sales-channel ile link üzerinden ilişkilenir.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
