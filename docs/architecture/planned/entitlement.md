# entitlement — Yetkilendirme ve Limit/Paywall Katmanı   [🔮 Planlanan]

## Amaç
Kullanıcı veya kiracı (tenant) bazlı plan/tier sınırlarını ve özellik/içerik erişimlerini yönetir, tüketim limitlerini takip eder.

## Neden gerek (sektör boşluğu)
Ödeme modülleri ve `revenue` plugin'i abonelik gelirlerini toplar; fakat hangi kiracının hangi özelliğe (feature), hangi limitle ve hangi süreyle erişebileceğinin runtime kontrolü (paywall/entitlement enforcement) platformda mevcut değildir.

## Önerilen veri modeli
- **Feature** — sisteme kayıtlı özellikler (key, name, description).
- **Tier** — üyelik paketleri (name, features: json).
- **Entitlement** — kiracının aktif hakları (tenant_id, feature_key, limit, consumed, expires_at).

## Açtığı dikeyler (+ kaç dikey)
~5 dikey açar: SaaS/app, üyelik/topluluk, eğitim, fitness, DTC-abonelik kutusu.

## Efor (S/M/L + gerekçe)
M (Orta): Runtime yetkilendirme kontrolü, middleware ve limit aşım durumlarının yönetimi orta efor gerektirir.

## Bağımlılıklar
`revenue` (abonelik verisi), `rbac` (rol kontrolü), `settings`.

## Durum: 🔮 Planlanan — henüz başlanmadı
