# restaurant-ops — Restoran Operasyonları & Kutfak Ekranı (KDS)   [🔮 Planlanan]

## Amaç
Restoran ve kafeler için masa oturumu takibi, mutfak hazırlık ekranı (Kitchen Display System - KDS), masa siparişi birleştirme/bölme (split-bill) ve malzeme reçetesi (BOM) entegrasyonu sağlar.

## Neden gerek (sektör boşluğu)
E-ticaret siparişleri anlık sepet ödemesiyle sonlanır. Restorandaki masada canlı seans açma, sürekli yeni sipariş ekleme, ödemeyi masa sonunda bölüşme ve mutfak hazırlık ekranları standart yapıda bulunmaz.

## Önerilen veri modeli
- **Table** — restoran masası (table_number, capacity, status: `occupied` | `empty`).
- **TableSession** — masada açılan canlı seans (table_id, customer_count, opened_at, closed_at).
- **KitchenTicket** — mutfağa iletilen sipariş kalemi (order_id, status: `pending` | `preparing` | `ready`, notes).

## Açtığı dikeyler (+ kaç dikey)
Restoran / kafe dikeyi.

## Efor (S/M/L + gerekçe)
L (Büyük): Canlı WebSocket tabanlı mutfak ekranı senkronizasyonları, masa bazlı dinamik sepet yönetimi ve fatura bölme (split-bill) hesapları yüksek efor ister.

## Bağımlılıklar
`order`, `cart`.

## Durum: 🔮 Planlanan — henüz başlanmadı
