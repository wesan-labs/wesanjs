# made-to-order — Sipariş Üzerine Üretim ve İş-Emri Çekirdeği   [🔮 Planlanan]

## Amaç
Standart dışı, konfigüre edilebilir özel üretim ürünlerin sipariş süreçlerini (teklif/RFQ, dinamik metretül/m² fiyatlandırması, malzeme reçetesi - BOM, üretim iş emri aşamaları) yönetir.

## Neden gerek (sektör boşluğu)
E-ticaret çekirdeği hazır/stoklu mallar satmaya ayarlıdır; özel ölçü, kumaş veya malzeme ile sipariş üzerine üretime başlama, hammadde reçete takibi ve üretim bandındaki aşama takipleri (Kanban/durum makinesi) standart yapıda bulunmaz.

## Önerilen veri modeli
- **RfqRequest** — müşteri talep formu (customer_id, custom_specs: json).
- **Quote** — hazırlanan teklif (rfq_id, version, price, valid_until, status).
- **BillOfMaterials (BOM)** — üretim için gereken hammadde reçetesi (variant_id, raw_materials: json).
- **WorkOrder** — üretim iş emri (order_id, steps: json, status: `cutting` | `sewing` | `assembly` | `completed`).

## Açtığı dikeyler (+ kaç dikey)
~7 dikey açar: Mobilya, mutfak/doğrama, mermer, terzi, gıda üretimi (özel sipariş/pasta), oto-servis (kısmen).

## Efor (S/M/L + gerekçe)
L (Büyük): Dinamik fiyat kuralları motoru, iş emri durum makinesi ve hammadde envanter entegrasyonu geniş kapsamlı geliştirme gerektirir.

## Bağımlılıklar
`draft-order` (veya `order`), `inventory`, `pricing`.

## Durum: 🔮 Planlanan — henüz başlanmadı
