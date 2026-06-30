# booking — Rezervasyon ve Takvim Omurgası   [🔮 Planlanan]

## Amaç
Kaynakların (personel, oda, koltuk, cihaz vb.) takvim müsaitliğini, slot tanımlarını, çakışma kontrollerini ve randevu oluşturma süreçlerini yönetir.

## Neden gerek (sektör boşluğu)
Mevcut e-ticaret çekirdeği fiziksel malların satışına odaklanmıştır; saat bazlı slotlar, zaman dilimleri, çakışma koruması (double-booking prevention) ve personel müsaitliği gibi zaman-tabanlı envanter yapısını desteklemez.

## Önerilen veri modeli
- **BookingResource** — randevuya konu kaynak (ad, tip: personel/oda/cihaz, kapasite).
- **BookingSchedule** — kaynağın çalışma saatleri (resource_id, day_of_week, start_time, end_time).
- **BookingSlot** — oluşturulan zaman dilimi (resource_id, start_time, end_time, status: `open` | `booked` | `blocked`).
- **Booking** — randevu kaydı (customer_id, resource_id, start_time, end_time, status: `pending` | `confirmed` | `cancelled` | `no_show`).

## Açtığı dikeyler (+ kaç dikey)
~11 dikey açar: Estetik, diş, fitness, kuaför, veteriner, restoran (masa), otel (geceleme), emlak (görüntüleme), profesyonel hizmet, oto-servis, etkinlik.

## Efor (S/M/L + gerekçe)
L (Büyük): Zaman dilimi hesaplamaları, timezone dönüşümleri, çakışma yönetimi ve harici takvim (Google Calendar vb.) senkronizasyonları yüksek karmaşıklık içerir.

## Bağımlılıklar
`customer`, `product` (hizmet kataloğu), `payment`.

## Durum: 🔮 Planlanan — henüz başlanmadı
