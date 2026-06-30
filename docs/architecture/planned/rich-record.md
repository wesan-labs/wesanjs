# rich-record — Zengin Müşteri Kaydı (EHR-lite)   [🔮 Planlanan]

## Amaç
Müşteri (Customer) kartlarına bağlı olarak, dikey-spesifik detaylı ve hassas veri depolamaya (hasta dosyası, evcil hayvan karne/aşı geçmişi, araç servis geçmişi) olanak tanıyan bir esnek veri yapısı sunar.

## Neden gerek (sektör boşluğu)
Standart customer modülü yalnızca kimlik, iletişim ve adres bilgileri tutar. Diş, estetik veya veterinerlik gibi sektörlerin detaylı tıbbi ve özel nitelikli verilerini, araç servisinin şasi numarası/plaka ve hasar geçmişini saklayacak bir yapı sunmaz.

## Önerilen veri modeli
- **RecordType** — veri şeması tanımı (name, schema: json).
- **RichRecord** — domain zengin kayıt (customer_id, type_id, data: json, encrypted_data: text).
- **RecordAccessLog** — KVKK/GDPR uyumluluğu için erişim logları (user_id, record_id, action).

## Açtığı dikeyler (+ kaç dikey)
~4 dikey açar: Estetik, diş, veteriner, oto-servis (araç geçmişi).

## Efor (S/M/L + gerekçe)
M (Orta): Esnek JSON şema validasyonları, hassas veri şifreleme (encryption at rest) ve KVKK uyumlu denetim loglaması gerektirir.

## Bağımlılıklar
`customer`.

## Durum: 🔮 Planlanan — henüz başlanmadı
