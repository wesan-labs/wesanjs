# Tasks — repo-içi iş planı / issue board

Markdown-tabanlı issue sistemi. Her dosya = bir issue (`NNNN-slug.md`), GitHub
Issues mantığıyla: durum · öncelik · etiket · kapsam (checklist) · "bitti sayılır".
İstenirse `gh` ile gerçek GitHub Issues'a aynısı açılır (repo: `wesan-labs/wesanjs`).

**Durum anahtarı:** 📋 Backlog (sırada, şimdi değil) · 🟢 Hazır (başlanabilir) ·
🚧 Devam · ✅ Bitti · ⏸️ Park (bir şeye bağlı)

## Açık

| # | Başlık | Durum | Öncelik | Etiket |
|---|--------|-------|---------|--------|
| [0004](0004-tenant-foundation.md) | **Tenant foundation + kanıt dilimi** | 🟢 Hazır — **ŞİMDİ** | Yüksek | multi-tenant |
| [0005](0005-tenant-id-rls-rollout.md) | tenant_id + RLS rollout | 📋 Backlog | Yüksek | multi-tenant |
| [0006](0006-entitlements-composable-panel.md) | Entitlements + kompoze panel | 📋 Backlog | Orta-Yüksek | multi-tenant |
| [0007](0007-per-tenant-rbac.md) | Per-tenant RBAC | 📋 Backlog | Orta-Yüksek | multi-tenant · auth |
| [0001](0001-tailwind-v4-migration.md) | Tailwind v3 → v4 geçişi | 📋 Backlog | Orta | infra · design-system |
| [0002](0002-ui-kit-chart-primitives.md) | UI kit: chart primitive port | 🟢 Hazır | Orta | ui · design-system |
| [0003](0003-geo-viz-kit.md) | Geo-viz kit (deck.gl + MapLibre) | 📋 Backlog (Faz 4) | Düşük | ui · geo |

**Mimari karar:** [docs/adr/0001-multi-tenancy.md](../docs/adr/0001-multi-tenancy.md) — pool (shared-schema) + tenant_id + RLS + entitlements + Medusa RBAC; schema-per-tenant **değil**. #0004-0007 bunu uygular.

## Backlog (küçük / sonra issue'ya dönüşür)

- **Görsel hosting aktivasyonu** — `helm/.env`'e `IMAGE_HOST=imgbb`+`IMGBB_API_KEY` (ya da Cloudinary); stüdyo görseli otomatik public URL'e yüklenip yayınlansın. Kod hazır, sadece env.
- **Versiyonlu docs** — `helm/docs/*` (content-studio.md, social-analytics.md) helm git'siz olduğu için versiyonsuz; repo'ya (wesanjs) taşı.
- **Sosyal: gerçek trend** — snapshot job birikince dashboard trend pill'leri/günlük grafik gerçek dolacak (kod hazır, sadece zaman).
