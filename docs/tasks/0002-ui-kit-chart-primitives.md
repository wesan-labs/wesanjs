# #0002 — UI kit: chart primitive port (Tremor yerine, kendi tema)

| | |
|---|---|
| **Durum** | 🟢 Hazır (başlanabilir, yeni bağımlılık yok) |
| **Öncelik** | Orta |
| **Etiketler** | ui · design-system · chart |
| **Oluşturma** | 2026-06-29 |

## Bağlam / Neden
Tremor v4-bloklu/temasıyla çakışıyor (bkz #0001). Aynı değeri **port yoluyla**
üretiyoruz: `recharts` + bizim `ui-*` token'lar, Tailwind v3, tek design system,
çakışma yok. "Sağlam modern UI kit"in çekirdeği bu — Tremor'a gerek yok.

## Mevcut (yapıldı)
- `dashboard/src/components/common/analytics/`: **`StatCard`**, **`GradientBar`**, **`DonutChart`** (recharts + token).
- `routes/social-media` bunları + design-system `Tabs`/`Table` + stacked recharts BarChart kullanıyor.

## Kapsam (sıradaki port partisi)
- [ ] `BarChart` (themed wrapper — tek/stacked, legend, themed tooltip)
- [ ] `AreaChart` (gradient fill, mevcut `routes/dashboards/kit/area-chart` genelleştir)
- [ ] `LineChart`
- [ ] `Sparkline` (mevcut kit'i common'a taşı)
- [ ] `MetricCard` / `Tracker` (KPI + durum şeridi)
- [ ] `components/common/analytics/index.ts` barrel + kısa kullanım README

## Bitti sayılır
- [ ] Hepsi `ui-*` token + dark/light uyumlu, `clx`/design-system primitive üstüne
- [ ] Social dashboard + (varsa) revenue/overview bunları kullanıyor (tek kaynak)
- [ ] Yeni npm bağımlılığı yok (sadece mevcut `recharts`)

## Notlar
- İleride `@wesan-labs/levios-ui` paketine taşınır (port-not-install gate). Bkz `levios-ui-component-libs-to-adopt`.
