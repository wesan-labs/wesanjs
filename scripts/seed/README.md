# Levios Seed Sistemi

Modüler, **sektör-kompoze**, idempotent Medusa seed. Sistemi gerçek veriyle çalışırken görmek için.

## Yer + taşınabilirlik

Kaynak burada — fork: `wesanjs/scripts/seed/`, git ile versiyonlu. Bir Medusa app'inde
çalıştırmak için app'in `src/seed`'ini buraya symlink'le:

```bash
ln -s ../../wesanjs/scripts/seed <app>/src/seed
cd <app> && npx medusa exec ./src/seed/index.ts all
```

`helm` böyle bağlı (`helm/src/seed` → bu klasör). Klasörün app'e hiçbir özel kuplajı yok —
tüm dış import'lar standart Medusa (`@medusajs/framework/*`, `@medusajs/medusa/core-flows`),
relatif import'lar klasör-içi. Symlink runtime'ı bozmaz (doğrulandı).

## Mimari

```
index.ts        dispatcher: hedef → modül id'leri (resolveIds) → dependsOn topo-sort → çalıştır
reset.ts        commerce demo verisini temizler (region/depo/kargo/müşteri korunur)
registry.ts     modül id → Seeder map (yeni modül = bir satır)
sectors.ts      sektör → modül listesi (yeni sektör = bir satır)
lib/
  seeder.ts     Seeder tipi: { id, label, dependsOn?, hasBackend, run? }
  fixtures.ts   deterministik sahte veri (fakeCustomer)
  medusa.ts     ortak helper: getStoreCurrency, getDefaultSalesChannelId, slug
modules/
  commerce-foundation.seed.ts   region + stok lokasyonu + kargo zinciri (ön koşul)
  customers.seed.ts             müşteriler + gruplar
  products.seed.ts              ürünler + varyant + fiyat + stok seviyesi
  orders.seed.ts                sipariş → rezervasyon → fulfillment → complete
```

## Kullanım

```bash
npx medusa exec ./src/seed/index.ts all                 # her şey (dependsOn'a göre sıralı)
npx medusa exec ./src/seed/index.ts ecommerce           # bir sektör
npx medusa exec ./src/seed/index.ts modules:products     # tek modül
npx medusa exec ./src/seed/index.ts modules:orders 20    # 20 sipariş
npx medusa exec ./src/seed/reset.ts                      # temiz veri döngüsü → sonra tekrar bas
```

## Yeni modül eklemek

1. `modules/<x>.seed.ts` → `export const xSeeder: Seeder = { id, label, hasBackend:true, dependsOn?, async run(ctx){...} }`
2. `registry.ts` → bir satır ekle
3. (opsiyonel) `sectors.ts` → ilgili sektör listesine ekle

`hasBackend:false` = UI kabuğu, backend modülü yok → dispatcher atlar (sms/social/hms/otel…).

## Doğrulanmış Medusa v2 gotcha'ları

- core-flows import yolu = **`@medusajs/medusa/core-flows`** (`@medusajs/core-flows` çözülmez).
- `createOrderWorkflow` cart'sız: `items:[{variant_id, quantity}]` yeter; TS `unit_price` ister → `as any`.
- `createProductsWorkflow` `manage_inventory:true` → envanter kalemi otomatik, **stok seviyesi DEĞİL**
  → `batchInventoryItemLevelsWorkflow` ayrı çağrılır.
- Fiyat `amount` = **MAJOR birim (ondalık), cent DEĞİL** (v2 BigNumber): `149` → ₺149,00.
- **Fulfillment (stok düşümü) 4 ön koşul:** (i) siparişin shipping method'unda `shipping_option_id`,
  (ii) ürün `shipping_profile_id` == option'ın profili, (iii) `manual_manual` provider'ı lokasyona
  `remoteLink.create` ile bağlı, (iv) fulfillment'tan önce rezervasyon.
- fulfillment set id → `fulfillmentModule.listFulfillmentSets` (retrieveStockLocation relation'ı dolmuyor).

## Erişim

```
DB:        postgres://postgres:postgres@localhost:5432/helm   (docker: helm-postgres-1)
Backend:   :9000     Dashboard: :5173     Admin: admin@helm.local / supersecret123
```
