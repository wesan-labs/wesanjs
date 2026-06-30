# notification — Bildirim gönderimi ve şablon yönetimi   [✅ upstream Medusa]

## Ne yapar
Sipariş onayları, üyelik mailleri, şifre sıfırlama gibi olaylar gerçekleştiğinde müşterilere veya personellere gönderilecek e-posta, SMS vb. bildirimlerin gönderimini ve kuyruğunu yönetir.

## Ana modeller / kavramlar
- **Notification** — gönderilen bildirim kaydı (to, channel: `email` | `sms` | `push`, template_id, data, status: `sent` | `failed`).

## Public yüzey (özet)
`send` (bildirim gönder), `listNotifications`, `retrieveNotification`.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
