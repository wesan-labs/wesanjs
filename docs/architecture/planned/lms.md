# lms — Eğitim ve Kurs Yönetim Modülü   [🔮 Planlanan]

## Amaç
Online eğitim platformları için kurs müfredatı oluşturma, ders hiyerarşisi, video içerik koruma (DRM), öğrenci kayıtları (enrollment) ve ilerleme (progress) durumlarını yönetir.

## Neden gerek (sektör boşluğu)
E-ticaret motoru "satış" anına kadar çalışır; ancak satış sonrasında müşterinin bir eğitim içeriğini adım adım tüketmesi, hangi dersi bitirdiği ve video içeriklerin yetkisiz indirilmesini önleyici altyapı Medusa'da bulunmaz.

## Önerilen veri modeli
- **Course** — eğitim kursu temel bilgileri (title, description, price_variant_id).
- **Lesson** — ders üniteleri (course_id, order, content_type: `video` | `text` | `quiz`, content_url).
- **Enrollment** — kursa kayıtlı öğrenciler (customer_id, course_id, status: `active` | `completed`).
- **LessonProgress** — öğrencinin ders tamamlanma durumları (enrollment_id, lesson_id, status: `completed` | `in_progress`).

## Açtığı dikeyler (+ kaç dikey)
Eğitim / online kurs dikeyi.

## Efor (S/M/L + gerekçe)
L (Büyük): Video hosting servisleri (Mux, Vimeo vb.) entegrasyonu, signed token yönetimi ve karmaşık ders/müfredat hiyerarşi ağacı büyük geliştirme eforu ister.

## Bağımlılıklar
`customer`, `content`, `entitlement` (ders izleme yetkisi).

## Durum: 🔮 Planlanan — henüz başlanmadı
