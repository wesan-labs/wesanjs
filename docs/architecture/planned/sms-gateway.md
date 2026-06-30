# sms-gateway — SMS ve WhatsApp Bildirim Modülü   [🔮 Planlanan]

## Amaç
Randevu hatırlatma, teklif onayları, aşı çağrıları, durum güncellemeleri ve no-show uyarıları için SMS ve WhatsApp API entegrasyonlarını standart bir arayüzle sağlar.

## Neden gerek (sektör boşluğu)
Medusa core bildirim yapısı e-posta odaklıdır; mobil anlık iletişim ve onay gerektiren randevu/üretim dikeylerinin SMS ve WhatsApp üzerinden haberleşme ihtiyacı için bir geçit (gateway) bulunmaz.

## Önerilen veri modeli
- **SmsTemplate** — bildirim şablonları (name, content_template, variable_keys: json).
- **SmsMessage** — gönderilen mesajların geçmişi ve durumu (to, body, provider, status: `pending` | `sent` | `failed`, response_payload).

## Açtığı dikeyler (+ kaç dikey)
Tüm randevu dikeyleri (5/5 sağlık ve kişisel bakım) + teklif/onay kullanan tüm üretim ve servis dikeyleri.

## Efor (S/M/L + gerekçe)
S (Küçük): Dış SMS/WhatsApp sağlayıcılarına (Twilio, Netgsm vb.) bağlanacak entegrasyon adaptörlerinden oluşur.

## Bağımlılıklar
`notification`.

## Durum: 🔮 Planlanan — henüz başlanmadı
