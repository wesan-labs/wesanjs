# order — Sipariş (kalem, edit, iade/değişim, claim, taslak)   [✅ upstream Medusa]

## Ne yapar
Tamamlanmış siparişleri ve sonrasındaki tüm yaşam döngüsü işlemlerini (iade, değişim, claim, düzenleme) yönetir. Sepetten dönüşen kalıcı satış kaydıdır.

## Ana modeller / kavramlar
- **Order** — sipariş başlığı (müşteri, toplamlar, durum)
- **OrderLineItem** — sipariş satır kalemi
- **OrderShippingMethod** — seçilen teslimat yöntemi
- **OrderChange / OrderEdit** — siparişe sonradan yapılan değişiklik
- **Return** — iade
- **Exchange** — değişim (iade + yeni kalem)
- **Claim** — hasarlı/eksik ürün talebi
- **Draft Order** — admin tarafından oluşturulan taslak sipariş

## Public yüzey (özet)
`createOrders`, `retrieveOrder`, `listOrders`, `createReturn`, `createExchange`, `createClaim`, order edit akışları. Versiyonlu değişiklik (OrderChange) ile siparişin tarihçesi tutulur.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
