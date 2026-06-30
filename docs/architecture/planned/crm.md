# crm — Fırsat ve Satış Boru Hattı (Pipeline)   [🔮 Planlanan]

## Amaç
B2B veya yüksek montanlı satışlarda (emlak vb.) potansiyel müşterilerin (leads), satış tekliflerinin (deals) ve bunlara bağlı görüşme/aktivite geçmişinin takibini sağlar.

## Neden gerek (sektör boşluğu)
E-ticaret modelleri doğrudan satın almaya (transitional) odaklıdır. Emlak satışı veya profesyonel danışmanlık gibi uzun süren teklifleşme, pazarlık ve müşteri ilişkisi takibi (CRM) gerektiren süreçleri desteklemez.

## Önerilen veri modeli
- **Lead** — potansiyel müşteri adayı (ad, şirket, iletişim, durum: `new` | `qualified` | `lost`).
- **Deal** — satış fırsatı/teklifi (lead_id, value, stage: `contact` | `proposal` | `negotiation` | `closed_won` | `closed_lost`, owner_id).
- **CrmActivity** — lead veya deal ile yapılan görüşmeler (deal_id, type: `call` | `email` | `meeting`, notes).

## Açtığı dikeyler (+ kaç dikey)
~2 dikey açar: Emlak, profesyonel hizmetler.

## Efor (S/M/L + gerekçe)
M (Orta): Boru hattı aşamalarının sürükle-bırak (Kanban) yönetimi ve dinamik aktivite loglaması orta zorluktadır.

## Bağımlılıklar
`customer`, `user` (sales representative).

## Durum: 🔮 Planlanan — henüz başlanmadı
