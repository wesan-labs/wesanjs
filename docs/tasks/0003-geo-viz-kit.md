# #0003 — Geo-viz kit (deck.gl + MapLibre + react-map-gl)

| | |
|---|---|
| **Durum** | 📋 Backlog (Faz 4 — gerçek harita ekranı doğunca) |
| **Öncelik** | Düşük |
| **Etiketler** | ui · geo · chart |
| **Oluşturma** | 2026-06-29 |

## Bağlam / Neden (KARAR 2026-06-29)
Modern geo-viz için **güncel + uyumlu + tema-çakışmasız** stack:
```
MapLibre GL    → base harita (vektör, ücretsiz tile, theme-aware)
+ deck.gl      → ağır katman (teslimat rotası / arc / heatmap / 3D bölge; v9.x aktif, MapLibre native)
+ react-map-gl → React binding (vis.gl ailesi)
```
Hepsi **rendering engine** (recharts gibi kurulur, port değil) → Tailwind tema
çakışması YOK. (Tremor'ın tersi.)

## Elenenler (kanıtla)
- ❌ **react-simple-maps:** orijinal 4 yıl stale (React 19 yok); canlı yol React-19-only fork, biz React 18 → uymaz. İşini MapLibre modern yapıyor.
- ⏸️ **Tremor:** v4-bloklu (#0001), tema çakışır.

## Tetik / önkoşul
- **Gerçek harita ekranı + veri** olmadan kurma (deck.gl ağır bağımlılık). Use-case'ler:
  mağaza konumu · bölge/shipping görselleştirme · müşteri coğrafyası · teslimat rotası.

## Kapsam (ekran doğunca)
- [ ] `maplibre-gl` + `deck.gl` + `react-map-gl` install (dashboard ve/veya storefront)
- [ ] `components/common/geo/` temalı base `Map` primitive (`ui-*` token, theme-aware tile)
- [ ] deck.gl katman wrapper'ları: rota (PathLayer/ArcLayer), heatmap, choropleth
- [ ] mapcn (https://www.mapcn.dev) referans alınarak shadcn-model API

## Bitti sayılır
- [ ] Gerçek bir veri ekranı (örn. teslimat rotası) bu kitle çiziliyor
- [ ] Tema dark/light uyumlu, API key gerektirmeyen ücretsiz tile

## Notlar
- Hafıza: `levios-ui-component-libs-to-adopt` (Harita/geo-viz kararı).
