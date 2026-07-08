# 3D Ürün Stüdyosu — Fiyatlandırma Çalışması (COGS → fiyat)

> **Durum:** Taslak · 2026-07-08 — kalemlerin bir kısmı ÖLÇÜLMÜŞ, bir kısmı HESAP/TAHMİN (işaretli).
> **Kural:** Fiyat kartı, ilk gerçek uçtan-uca run'ların fatura panellerinden okunan ÖLÇÜLMÜŞ COGS ile kilitlenir. Tahminle fiyat kilitleme YOK.
> **Bağlam:** [2026-07-07-3d-product-studio-design.md](./2026-07-07-3d-product-studio-design.md) (§5 host kararları, §5b pipeline=veri)

## 1. Birim maliyet — bir ürünün TAM içerik paketi

| Kalem | Maliyet | Kanıt durumu |
|--|--|--|
| Arka plan temizleme (stüdyo remove-bg) | $0 | client-side, API yok ✅ |
| ① Hero (BFL Flux2, temiz stüdyo sahne) | ~$0.04–0.06 | BFL fiyat sayfası, kredi bazlı (1 kredi=$0.01) — *yaklaşık* |
| ② 360° orbital 5sn 720p (Seedance 2.0 Fast / WaveSpeed) | **$1.00** | fiyat listesi DOĞRULANDI 2026-07-09: $0.50 baz(480p·5s) ×2(720p); 1080p=×5($2.50), direkt 4K=×10($5) → optimal 720p+SeedVR-4K=$1.25 |
| ③ 4K upscale 5sn (SeedVR/WaveSpeed) | $0.25 | fiyat listesi + canlı çalıştırıldı (2026-07-08) ✅ |
| ④ 72 kare çıkarma (ffmpeg) | $0 | lokal ✅ |
| Konsept/marka-sahne (Faz C, ~5 varyant) | ~$0.20–0.65 | görsel başı $0.04–0.13 (Flux2/Gemini) — *yaklaşık* |
| **Ham toplam / ürün** | **~$0.95–1.80** | |
| Retry payı (×1.5) | **~$1.4–2.7** | sektör gerçeği |

**Tek cümle:** komple paket (hero + 360° 4K video + 72 kare + 5 konsept) ≈ **$1.5–2.5 COGS/ürün**.

## 2. Fiyat çevirisi (öneri, kilitli DEĞİL)

- **Değer referansı:** müşterinin alternatifi ürün çekimi + stüdyo + retouch = $100–500/ürün. Değer-bazlı fiyatla, maliyet-bazlı değil.
- **Ürün-paketi:** $10–20/ürün (5–8× markup).
- **Aylık plan:** 20 ürün/ay → COGS ~$40 → **$99–149/ay** savunulur.
- **Ucuz tier:** video'suz "görsel paketi" (hero + konseptler) COGS ~$0.3 → giriş paketi.
- **Kredi-gated şart** (spec §8): en pahalı kalem video (②+③ ≈ $0.7–1.1); sınırsız paket bu maliyetle satılamaz.

## 3. Metering — mimariden bedava

Pipeline=veri (§5b) sayesinde her `op` çağrısı descriptor'dan ölçülebilir → adım-bazlı sayaç (kim kaç hero/video yaktı → kredi düşümü) ayrı billing altyapısı istemez. Faturalama kalemi = operasyon kaydı.

## 4. Yapılacak (fiyat kartını kilitlemeden önce)

- [ ] İlk 5–10 gerçek uçtan-uca run → üç sağlayıcının fatura panelinden ÖLÇÜLMÜŞ kalem maliyetleri
- [ ] ② Seedance gerçek token tüketimi (hesabı doğrula: 5sn 720p kaç token?)
- [ ] Retry oranı gerçek kullanım verisiyle (×1.5 varsayımını değiştir)
- [ ] Kredi fiyat kartı: 1 kredi = ? · paket boyutları · tier'lar
- [ ] Gemini alternatif maliyet A/B'si (① hero için; §5 Gemini analizi — ③'ün Gemini karşılığı YOK)
