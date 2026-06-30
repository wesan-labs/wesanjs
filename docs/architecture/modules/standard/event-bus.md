# event-bus — Olay yayını ve asenkron haberleşme (local / redis)   [✅ upstream Medusa]

## Ne yapar
Uygulama içinde gerçekleşen olayları (örn: sipariş oluşturulması, ürün güncellenmesi) asenkron veya senkron olarak yayınlar (emit) ve bu olayları dinleyen servisleri (subscribers) tetikler. Local (bellek içi/geliştirme amaçlı) veya Redis (kuyruk tabanlı/üretim amaçlı) sağlayıcıları bulunur.

## Ana modeller / kavramlar
- Olay kuyrukları, dinleyiciler (subscribers) ve olay veri paketleri (payloads).

## Public yüzey (özet)
`emit` (olay yayınla), `subscribe` (olay dinleyici kaydet), `unsubscribe` (olay dinleyici kaldır).

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
