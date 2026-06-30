# cache — Önbellek yönetimi (cache-inmemory / cache-redis / caching)   [✅ upstream Medusa]

## Ne yapar
Medusa uygulamalarında sık sorgulanan veya hesaplaması pahalı olan verilerin önbelleğe alınmasını ve gerektiğinde önbelleğin temizlenmesini (invalidation) yönetir. Bellek içi (In-Memory) ve Redis tabanlı iki farklı sağlayıcı (provider) yapısı sunar.

## Ana modeller / kavramlar
- Bellek içi veya Redis sunucusundaki anahtar-değer (Key-Value) veri depoları.

## Public yüzey (özet)
`get` (değer oku), `set` (değer yaz), `invalidate` (önbellek temizle).

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
