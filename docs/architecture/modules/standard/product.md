# product — Ürün kataloğu (varyant, opsiyon, koleksiyon, kategori)   [✅ upstream Medusa]

## Ne yapar
Satılabilir ürünleri ve onların varyantlarını, opsiyonlarını ve sınıflandırmalarını yönetir. Mağazanın katalog çekirdeğidir.

## Ana modeller / kavramlar
- **Product** — temel ürün (başlık, açıklama, durum, görseller)
- **ProductVariant** — satılabilir somut birim (SKU, barkod)
- **ProductOption / ProductOptionValue** — beden, renk gibi seçenekler ve değerleri
- **ProductCollection** — ürün koleksiyonu (vitrin gruplaması)
- **ProductCategory** — hiyerarşik kategori ağacı
- **ProductType / ProductTag** — tip ve etiket sınıflandırması
- **ProductImage** — ürün görselleri

## Public yüzey (özet)
`createProducts`, `updateProducts`, `listProducts`, `retrieveProduct`, varyant/opsiyon/kategori/koleksiyon CRUD'ları. Fiyat ve stok DEĞİLDİR — onlar pricing/inventory modüllerinde, link ile bağlanır.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
Fiziksel-mal odaklı; hizmet/randevu/abonelik gibi kavramlar için zorlanır. Varyant = satılabilir birim varsayımı, zaman-temelli (seans, gece) ürünlerde doğal oturmaz.
