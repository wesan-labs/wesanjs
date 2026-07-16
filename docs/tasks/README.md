# Tasks — repo-içi iş planı / issue board

Markdown-tabanlı issue sistemi. Her dosya = bir issue (`NNNN-slug.md`), GitHub
Issues mantığıyla: durum · öncelik · etiket · kapsam (checklist) · "bitti sayılır".
İstenirse `gh` ile gerçek GitHub Issues'a aynısı açılır (repo: `wesan-labs/wesanjs`).

**Durum anahtarı:** 📋 Backlog (sırada, şimdi değil) · 🟢 Hazır (başlanabilir) ·
🚧 Devam · ✅ Bitti · ⏸️ Park (bir şeye bağlı)

## Açık

| # | Başlık | Durum | Öncelik | Etiket |
|---|--------|-------|---------|--------|
| [0014](0014-security-baseline.md) | **Güvenlik temeli: RLS uyandır + RBAC policies** (ADR-0004 A1) | 🟡 Kanıt 19/19 ✓ + policies ✓ — set_config wiring slice 2 | Yüksek | security · multi-tenant · rbac |
| [0013](0013-content-studio-ship-goal.md) | **Content Studio: Ship hedefi (north-star)** | 🎯 Aktif | Yüksek | content-studio · goal |
| [0012](0012-brand-identity.md) | Marka kimliği (brand profile) — Adım ⓪ | 📋 Backlog | Yüksek | content-studio · brand |
| [0008](0008-rbac-finance-pilot.md) | **RBAC Finance pilot + onboarding** | 🟡 Service ✅ UI kaldı | Yüksek | rbac · onboarding |
| [0009](0009-tenant-isolation-proof.md) | İki tenant izolasyon kanıtı | 🟡 Service ✅ UI kaldı | Yüksek | multi-tenant · qa |
| [0011](0011-content-studio-pack-engine.md) | **Content Studio Pack & Template Engine** | 📋 Backlog | Yüksek | content-studio · ai · packs |
| [0010](0010-observability-plugin.md) | **Hosted vertical analytics (ADR-0003)** | 🟢 Hazır | Orta-Yüksek | analytics · posthog · glitchtip |
| [0004](0004-tenant-foundation.md) | Tenant foundation + kanıt dilimi | 🚧 Devam | Yüksek | multi-tenant |
| [0005](0005-tenant-id-rls-rollout.md) | tenant_id + RLS rollout | 🚧 Devam (cms/content/revenue ✅) | Yüksek | multi-tenant |
| [0006](0006-entitlements-composable-panel.md) | Entitlements + kompoze panel | 📋 Backlog | Orta-Yüksek | multi-tenant |
| [0007](0007-per-tenant-rbac.md) | Per-tenant RBAC | 🟡 Temel wire — UI atama bekliyor | Orta-Yüksek | multi-tenant · auth |
| [0001](0001-tailwind-v4-migration.md) | Tailwind v3 → v4 geçişi | 📋 Backlog | Orta | infra · design-system |
| [0002](0002-ui-kit-chart-primitives.md) | UI kit: chart primitive port | 🟢 Hazır | Orta | ui · design-system |
| [0003](0003-geo-viz-kit.md) | Geo-viz kit (deck.gl + MapLibre) | 📋 Backlog (Faz 4) | Düşük | ui · geo |

**Mimari karar:** [docs/adr/0001-multi-tenancy.md](../docs/adr/0001-multi-tenancy.md) — pool (shared-schema) + tenant_id + RLS + entitlements + Medusa RBAC; schema-per-tenant **değil**. #0004-0007 bunu uygular.

**Ürün sırası + build kuyruğu:** [docs/adr/0004](../docs/adr/0004-product-sequence-composable-panel.md) — önce A (admin panel platformu + AI composer), sonra B (webshop builder). Kuyruk: A1 #0014 → A2 #0006 → A3 ikinci set → A4 composer → KAPI #0005.

## Backlog (küçük / sonra issue'ya dönüşür)

- **Görsel hosting aktivasyonu** — `helm/.env`'e `IMAGE_HOST=imgbb`+`IMGBB_API_KEY` (ya da Cloudinary); stüdyo görseli otomatik public URL'e yüklenip yayınlansın. Kod hazır, sadece env.
- **Versiyonlu docs** — `helm/docs/*` (content-studio.md, social-analytics.md) helm git'siz olduğu için versiyonsuz; repo'ya (wesanjs) taşı.
- **Sosyal: gerçek trend** — snapshot job birikince dashboard trend pill'leri/günlük grafik gerçek dolacak (kod hazır, sadece zaman).
