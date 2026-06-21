import {
  batchInventoryItemLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { getDefaultSalesChannelId, getStoreCurrency, slug } from "../lib/medusa"
import { Seeder } from "../lib/seeder"

// Demo ürün kataloğu. Medusa v2'de amount = MAJOR birim (ondalık), cent DEĞİL: 149 → ₺149,00
type ProductDef = {
  title: string
  desc: string
  colors: string[]
  sizes: string[]
  base: number
}

const CATALOG: ProductDef[] = [
  { title: "Klasik Tişört", desc: "%100 pamuk, günlük kullanım.", colors: ["Siyah", "Beyaz", "Lacivert"], sizes: ["S", "M", "L", "XL"], base: 149 },
  { title: "Kapüşonlu Sweatshirt", desc: "İçi polar, kanguru cep.", colors: ["Gri", "Siyah"], sizes: ["M", "L", "XL"], base: 399 },
  { title: "Slim Fit Kot Pantolon", desc: "Likralı, dar kesim.", colors: ["Mavi", "Siyah"], sizes: ["30", "32", "34", "36"], base: 499 },
  { title: "Spor Ayakkabı", desc: "Hafif taban, nefes alır.", colors: ["Beyaz", "Siyah"], sizes: ["40", "41", "42", "43", "44"], base: 899 },
  { title: "Deri Cüzdan", desc: "Hakiki deri, RFID korumalı.", colors: ["Kahve", "Siyah"], sizes: ["Std"], base: 299 },
  { title: "Yün Bere", desc: "Kışlık, akrilik karışım.", colors: ["Antrasit", "Bordo", "Haki"], sizes: ["Std"], base: 99 },
]

export const productsSeeder: Seeder = {
  id: "products",
  label: "Commerce — ürünler + stok",
  hasBackend: true,
  dependsOn: ["commerce-foundation"],
  async run({ container, log }) {
    const productModule: any = container.resolve(Modules.PRODUCT)

    // Idempotent: ürün varsa atla (yeniden basınca çoğaltmaz).
    const existing = await productModule.listProducts({}, { take: 1 })
    if (existing.length) {
      log(`ürün zaten var, atlandı`)
      return
    }

    const currency = await getStoreCurrency(container)
    const salesChannelId = await getDefaultSalesChannelId(container)
    // Ürün, kargo option'ı ile AYNI shipping profile'a bağlı olmalı (fulfillment şartı).
    const fulfillmentModule: any = container.resolve(Modules.FULFILLMENT)
    const shippingProfile = (
      await fulfillmentModule.listShippingProfiles({}, { take: 1 })
    )[0]

    const products = CATALOG.map((p) => ({
      title: p.title,
      description: p.desc,
      status: "published" as const,
      ...(salesChannelId ? { sales_channels: [{ id: salesChannelId }] } : {}),
      ...(shippingProfile ? { shipping_profile_id: shippingProfile.id } : {}),
      options: [
        { title: "Renk", values: p.colors },
        { title: "Beden", values: p.sizes },
      ],
      variants: p.colors.flatMap((color) =>
        p.sizes.map((size) => ({
          title: `${color} / ${size}`,
          sku: `${slug(p.title)}-${slug(color)}-${slug(size)}`,
          // manage_inventory:true → her varyant için envanter kalemi otomatik oluşur.
          // Stok seviyeleri aşağıda ayrıca yazılır (gerçek stok = gerçek veri).
          manage_inventory: true,
          options: { Renk: color, Beden: size },
          prices: [{ amount: p.base, currency_code: currency }],
        }))
      ),
    }))

    const { result } = await createProductsWorkflow(container).run({
      input: { products },
    })

    const variantCount = result.reduce(
      (n: number, p: any) => n + (p.variants?.length ?? 0),
      0
    )
    log(`ürün: +${result.length} (${variantCount} varyant, currency=${currency})`)

    // --- Stok seviyeleri: otomatik oluşan envanter kalemlerine, depoda miktar yaz ---
    const stockModule: any = container.resolve(Modules.STOCK_LOCATION)
    const location = (await stockModule.listStockLocations({}, { take: 1 }))[0]
    if (!location) {
      log(`stok lokasyonu yok — seviye yazılmadı (foundation çalıştı mı?)`)
      return
    }

    const inventoryModule: any = container.resolve(Modules.INVENTORY)
    const items = await inventoryModule.listInventoryItems(
      {},
      { select: ["id"], take: 5000 }
    )
    if (!items.length) {
      log(`envanter kalemi bulunamadı — seviye yazılmadı`)
      return
    }

    await batchInventoryItemLevelsWorkflow(container).run({
      input: {
        create: items.map((it: any, idx: number) => ({
          inventory_item_id: it.id,
          location_id: location.id,
          stocked_quantity: 25 + (idx % 6) * 15, // 25..100 arası çeşitlilik
        })),
        update: [],
        delete: [],
      },
    })
    log(`stok seviyesi: ${items.length} kalem @ ${location.name}`)
  },
}
