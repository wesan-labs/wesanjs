# hotel-pms — Otel ve Konaklama Yönetim Sistemi   [🔮 Planlanan]

## Amaç
Otel odalarının gün/gece bazlı müsaitliğini, oda blokajlarını, giriş-çıkış (check-in/check-out) süreçlerini, harici kanal yöneticisi (OTA: Booking.com, Expedia vb.) entegrasyonunu ve müşteri harcama hesaplarını (folio) yönetir.

## Neden gerek (sektör boşluğu)
Mevcut randevu slotları saatlik/dakikalıktır. Otellerin gün/geceleme bazlı oda envanteri, oda temizlik/blokaj durumları ve harici satış kanallarıyla (OTA) çift yönlü envanter senkronizasyonu (Channel Manager) platformda bulunmaz.

## Önerilen veri modeli
- **RoomType** — oda kategorisi (ad, kapasite, özellikler).
- **Room** — fiziksel oda numarası (room_type_id, number, status: `dirty` | `clean` | `blocked`).
- **Stay** — konaklama detayları (booking_id, check_in_at, check_out_at, status: `active` | `completed`).
- **Folio** — oda hesabına eklenen ekstra harcamalar ve bakiye (booking_id, total_amount, balance).

## Açtığı dikeyler (+ kaç dikey)
Otel / konaklama dikeyi.

## Efor (S/M/L + gerekçe)
L (Büyük): Geceleme bazlı envanter kontrolü, Channel Manager entegrasyonu (iCal/XML sync) ve folio hesap yönetim sistemi oldukça karmaşık ve kapsamlıdır.

## Bağımlılıklar
`booking` (rezervasyon omurgası), `payment`, `pricing`.

## Durum: 🔮 Planlanan — henüz başlanmadı
