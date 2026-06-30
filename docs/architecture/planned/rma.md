# rma — İade Yetkilendirme ve Müşteri İade Portalı   [🔮 Planlanan]

## Amaç
Müşterilerin aldıkları ürünleri iade etme taleplerini online başlatmalarını, fotoğraflı kanıt eklemelerini, iade kargo etiketlerini otomatik oluşturmalarını ve onay süreçlerini yönetir.

## Neden gerek (sektör boşluğu)
Medusa core'da arka ofis iade (Return) modelleri mevcuttur; ancak müşterinin kendi panelinden iade talebi (RMA) başlatabileceği, kanıt yükleyip kargo barkodu alabileceği uçtan uca bir onay iş akışı (workflow) ve portal desteği bulunmaz.

## Önerilen veri modeli
- **RmaRequest** — iade talebi başlığı (order_id, customer_id, reason, details, status: `pending` | `approved` | `rejected`).
- **RmaItem** — iade edilmek istenen kalemler (line_item_id, quantity, condition).
- **RmaAttachment** — iadeye eklenen fotoğraflı kanıtlar (rma_id, file_url).

## Açtığı dikeyler (+ kaç dikey)
~3 dikey açar: Perakende e-ticaret, moda/tekstil DTC, el yapımı zanaat.

## Efor (S/M/L + gerekçe)
M (Orta): Müşteri arayüzü, kargo firmalarıyla iade etiketi oluşturma entegrasyonu ve onay/red workflows orta seviye efor gerektirir.

## Bağımlılıklar
`order`, `fulfillment`, `file`.

## Durum: 🔮 Planlanan — henüz başlanmadı
