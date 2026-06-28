# #0001 — Tailwind v3 → v4 geçişi

| | |
|---|---|
| **Durum** | 📋 Backlog (yapılacak, **şimdi değil**) |
| **Öncelik** | Orta |
| **Etiketler** | infra · design-system · blocking |
| **Oluşturma** | 2026-06-29 |
| **Açtıkları** | #0003 değil — ama Tremor Raw + shadcn son sürüm port'ları |

## Bağlam / Neden
Tailwind **v4 ekosistemin yeni baseline'ı** oldu; yeni "güncel" component kit'leri
v4 ister (örn. **Tremor Raw** Tailwind v4 şart; shadcn'in son sürümleri v4'e kayıyor).
v3'te kalmak bu modern kit'leri **bloklar**. Karar: biz de v4'e geçmeliyiz — ama ayrı
bir epik olarak, sosyal/içerik işiyle karıştırmadan.

## Mevcut durum
- Tailwind **v3.4.3** — `packages/design-system/ui-preset` peer `^3.4.3`.
- Tüm Medusa admin dashboard + `ui-*` token sistemi v3 üstünde.

## Kapsam (checklist)
- [ ] `ui-preset` (preset.ts + theme/tokens + theme/extension) → v4 modeli
- [ ] `tailwind.config.*` → v4 **CSS-first** (`@theme`) yaklaşımı
- [ ] PostCSS / Vite pipeline güncelle (v4 plugin)
- [ ] Tüm dashboard utility class'larını v4 ile doğrula (deprecated/renamed)
- [ ] `@medusajs/ui` design-system v3'e gömülü → **fork tarafında dikkat** (upstream drift)
- [ ] Görsel regresyon: admin + content + social ekranları

## Bitti sayılır
- [ ] Admin, content stüdyosu, social dashboard v4'te görsel/işlev olarak bozulmadan render
- [ ] `ui-*` token'lar v4'te birebir çalışıyor
- [ ] Yeni v4-gerektiren kit'ler (Tremor Raw / shadcn son) port edilebilir hale geliyor

## Notlar
- Devasa+riskli değil ama **küçük de değil** — ayrı epik, ayrı branch.
- Hafıza: `tailwind-v4-migration`, `levios-ui-component-libs-to-adopt`.
