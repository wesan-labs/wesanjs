# currency — Para birimi tanımları   [✅ upstream Medusa]

## Ne yapar
Mağazada veya platformda desteklenen para birimlerinin (USD, EUR, TRY vb.) sembollerini, adlarını ve ondalık basamak sayılarını tutan salt okunur veri sözlüğüdür.

## Ana modeller / kavramlar
- **Currency** — para birimi tanımı (code, symbol, symbol_native, name, decimal_places).

## Public yüzey (özet)
`listCurrencies`, `retrieveCurrency`. Modülde veri manipülasyonu (yaratma/güncelleme) yapılmaz, sistem varsayılan para birimlerini listelemek için kullanılır.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
