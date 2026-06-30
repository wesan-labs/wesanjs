# inventory — Stok yönetimi (kalem, konum seviyesi, rezervasyon)   [✅ upstream Medusa]

## Ne yapar
Satılabilir birimlerin fiziksel stok adedini konum bazında takip eder ve sipariş sırasında rezerve eder.

## Ana modeller / kavramlar
- **InventoryItem** — stoklanan kalem (genelde bir varyanta link'li)
- **InventoryLevel** — belirli bir stok konumundaki adet (stocked / reserved / available)
- **ReservationItem** — sipariş/sepet için ayrılmış (rezerve) adet

## Public yüzey (özet)
`createInventoryItems`, `createInventoryLevels`, `adjustInventory`, `createReservationItems`, `retrieveStockedQuantity`. Çekirdek: `available = stocked - reserved` hesabı ve rezervasyon yaşam döngüsü.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
Sadece **adet** sayar. Tarih-aralığı bazlı uygunluk (otel gecesi, randevu slotu) veya BOM/bileşen ürün (üretim reçetesi) kavramı yoktur — bunlar için ayrı bir availability modülü gerekir.
