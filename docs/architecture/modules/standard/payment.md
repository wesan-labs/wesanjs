# payment — Ödeme işlemleri (oturum, capture, refund)   [✅ upstream Medusa]

## Ne yapar
Alışveriş süreçlerindeki ödeme tahsilatlarını yönetir. Ödeme oturumlarını başlatır, tutarı bloke eder (authorize), tahsil eder (capture) ve iadeleri (refund) yönetir.

## Ana modeller / kavramlar
- **PaymentCollection** — sipariş veya sepet için ödeme grubu.
- **PaymentSession** — aktif ödeme oturumu (provider_id, amount, status).
- **Payment** — başarılı ödeme kaydı (amount, captured_at).
- **Refund** — geri ödeme kaydı (amount, reason).

## Public yüzey (özet)
`createPaymentCollection`, `authorizePaymentSession`, `capturePayment`, `refundPayment`, `listPayments`, `retrievePayment`.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
