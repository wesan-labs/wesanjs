import {
  completeOrderWorkflow,
  createOrderFulfillmentWorkflow,
  createOrderWorkflow,
  createReservationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { getDefaultSalesChannelId, getStoreCurrency } from "../lib/medusa"
import { Seeder } from "../lib/seeder"

// Gerçek satış akışı:
//   createOrderWorkflow (shipping_option'lı) → createReservationsWorkflow (reserved↑)
//   → [yarısı] createOrderFulfillmentWorkflow (stocked↓, rezervasyonu tüketir) → completeOrderWorkflow
// Ön koşul: region + ürün/stok + müşteri + kargo zinciri (foundation).
export const ordersSeeder: Seeder = {
  id: "orders",
  label: "Commerce — siparişler (rezervasyon + fulfillment)",
  hasBackend: true,
  dependsOn: ["commerce-foundation", "products", "customers"],
  async run({ container, count, log }) {
    const orderModule: any = container.resolve(Modules.ORDER)
    const target = Math.min(count, 15)

    const [, existingCount] = await orderModule.listAndCountOrders({}, { take: 1 })
    if (existingCount >= target) {
      log(`sipariş zaten ${existingCount}, atlandı`)
      return
    }

    // --- Ön koşulları topla ---
    const currency = await getStoreCurrency(container)
    const salesChannelId = await getDefaultSalesChannelId(container)
    const regionModule: any = container.resolve(Modules.REGION)
    const region = (await regionModule.listRegions({}, { take: 1 }))[0]
    const stockModule: any = container.resolve(Modules.STOCK_LOCATION)
    const location = (await stockModule.listStockLocations({}, { take: 1 }))[0]
    const fulfillmentModule: any = container.resolve(Modules.FULFILLMENT)
    const shippingOption = (
      await fulfillmentModule.listShippingOptions({}, { take: 1 })
    )[0]
    const productModule: any = container.resolve(Modules.PRODUCT)
    const variants = await productModule.listProductVariants(
      {},
      { take: 50, select: ["id", "sku"] }
    )
    const customerModule: any = container.resolve(Modules.CUSTOMER)
    const customers = await customerModule.listCustomers(
      {},
      { take: 30, select: ["id", "email"] }
    )
    // sku → inventory_item_id (otomatik oluşan envanter kalemleri varyant sku'sunu miras alır)
    const inventoryModule: any = container.resolve(Modules.INVENTORY)
    const invItems = await inventoryModule.listInventoryItems(
      {},
      { select: ["id", "sku"], take: 5000 }
    )
    const skuToInv = new Map<string, string>(
      invItems.map((i: any) => [i.sku, i.id])
    )

    if (!region || !salesChannelId || !location || !variants.length || !customers.length) {
      log(`ön koşul eksik (region/channel/depo/variant/customer), atlandı`)
      return
    }

    let placed = 0
    let fulfilled = 0
    for (let i = existingCount; i < target; i++) {
      const customer = customers[i % customers.length]
      const variant = variants[i % variants.length]
      const qty = (i % 3) + 1

      // 1) Sipariş (shipping_option'a bağlı kargo yöntemi ile)
      const { result: order } = await createOrderWorkflow(container).run({
        input: {
          email: customer.email,
          customer_id: customer.id,
          region_id: region.id,
          sales_channel_id: salesChannelId,
          currency_code: currency,
          items: [{ variant_id: variant.id, quantity: qty }] as any,
          shipping_address: {
            first_name: "Demo",
            last_name: "Müşteri",
            address_1: "Atatürk Cad. No:1",
            city: "İstanbul",
            country_code: "tr",
            postal_code: "34000",
          },
          shipping_methods: [
            {
              name: "Standart Kargo",
              amount: 29,
              ...(shippingOption ? { shipping_option_id: shippingOption.id } : {}),
              data: {},
            },
          ] as any,
        },
      })
      placed++

      // line item + inventory item
      const full = await orderModule.retrieveOrder(order.id, { relations: ["items"] })
      const lineItem = full.items?.[0]
      const inventoryItemId = skuToInv.get(variant.sku)
      if (!lineItem || !inventoryItemId) {
        continue
      }

      // 2) Rezervasyon (reserved↑) — her sipariş
      await createReservationsWorkflow(container).run({
        input: {
          reservations: [
            {
              line_item_id: lineItem.id,
              inventory_item_id: inventoryItemId,
              location_id: location.id,
              quantity: qty,
            },
          ],
        },
      })

      // 3) Yarısı: fulfillment (stocked↓) + complete — gerçek teslimat
      if (i % 2 === 0) {
        try {
          await createOrderFulfillmentWorkflow(container).run({
            input: {
              order_id: order.id,
              items: [{ id: lineItem.id, quantity: qty }],
              location_id: location.id,
            },
          })
          await completeOrderWorkflow(container).run({
            input: { orderIds: [order.id] },
          })
          fulfilled++
        } catch (e: any) {
          log(`  fulfillment atlandı (#${i}): ${e?.message ?? e}`)
        }
      }
    }
    log(`sipariş: +${placed} (rezerve: ${placed}, teslim: ${fulfilled})`)
  },
}
