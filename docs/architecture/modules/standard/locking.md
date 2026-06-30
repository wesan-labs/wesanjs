# locking — Dağıtık kilit yönetimi   [✅ upstream Medusa]

## Ne yapar
Eşzamanlı (concurrent) işlemlerde yarış durumlarını (race condition) engellemek amacıyla kaynak bazlı kilit mekanizması sunar. Örneğin, aynı stok kalemi üzerinde aynı anda işlem yapılmasını engeller.

## Ana modeller / kavramlar
- Dağıtık veya bellek içi kilit (lock) anahtarları ve TTL (time-to-live) değerleri.

## Public yüzey (özet)
`acquire` (kilit edinme), `release` (kilidi bırakma), `executeLocked` (kilitli blok çalıştırma).

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
