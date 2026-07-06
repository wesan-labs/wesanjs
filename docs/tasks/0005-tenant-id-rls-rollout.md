# #0005 — `tenant_id` + RLS rollout (tüm modüller + core)

| | |
|---|---|
| **Durum** | 📋 Backlog (#0004'ten sonra) |
| **Öncelik** | Yüksek |
| **Etiketler** | multi-tenant · backend |
| **Bağımlı** | #0004 (referans dilim) |
| **Karar** | ADR-0001 |

## Amaç
#0004'teki tenant_id + RLS desenini tüm domainlere yay. Okyanusu birden kaynatma —
modül modül, her birini canlı doğrula.

## Kapsam
- [x] **revenue-plugin** tabloları (App, RevenueSource, RevenueEvent, MetricSnapshot, Expense) → tenant_id + RLS ✅ (2026-07-02)
- [x] **cms-plugin** tabloları (CmsSite, CmsCollection, CmsEntry) → tenant_id + RLS
- [ ] **Medusa core** (ürün/sipariş/müşteri) → Store Module `store_id` tenant anahtarı olarak; veya RLS ile scope
- [x] Her modülde yazma yolunda tenant_id enjeksiyonu — revenue + content + cms app-layer ✅
- [ ] Migration'lar geriye-uyumlu (mevcut veriye default tenant ata)

## Bitti sayılır
- [ ] Her domain tenant-scoped; çapraz-tenant okuma RLS ile imkânsız
- [ ] Mevcut tek-tenant veri "default tenant"a taşınmış, bozulmamış
- [ ] CRM dashboard'u artık gerçek (tenant-scoped Customers) — sahte 0 sayılar gitti
