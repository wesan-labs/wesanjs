# promotion — Kampanyalar, kuponlar ve indirim kuralları   [✅ upstream Medusa]

## Ne yapar
Müşterilere sunulan indirim tekliflerini, kupon kodlarını ve kampanya koşullarını yönetir. Sepet tutarına veya belirli ürünlere indirimlerin uygulanmasını sağlar.

## Ana modeller / kavramlar
- **Promotion** — indirim tanımı (code, type: `standard` | `buyget`, status, is_automatic).
- **Campaign** — ilişkili promosyonları içeren kampanya grubu (start_date, end_date, budget).
- **PromotionRule** — promosyonun geçerli olması için gereken kurallar (attribute, operator, values).

## Public yüzey (özet)
`createPromotions`, `updatePromotions`, `listPromotions`, `retrievePromotion`, indirim kurallarının sepet üzerinde doğrulanması ve hesaplanması.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
