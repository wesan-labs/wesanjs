import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Commerce demo verisini temizler — FK-güvenli sıra:
//   reservation → order → product → inventory_item
// KORUR: region, stok lokasyonu, kargo zinciri (profile/set/zone/option), sales channel,
//        store, customers, admin. (Bunlar kararlı altyapı — her döngüde yeniden kurmaya gerek yok.)
//   npx medusa exec ./src/seed/reset.ts
const wipe = async (
  module: any,
  list: string,
  del: string,
  label: string,
  log: (m: string) => void
) => {
  const rows = await module[list]({}, { select: ["id"], take: 5000 })
  if (rows.length) {
    await module[del](rows.map((r: any) => r.id))
  }
  log(`${label}: -${rows.length}`)
}

export default async function reset({ container }: ExecArgs) {
  const log = (m: string) => console.log(`  ${m}`)
  console.log("\n🧹 commerce reset\n")

  const inventory = container.resolve(Modules.INVENTORY)
  await wipe(inventory, "listReservationItems", "deleteReservationItems", "reservation", log)
  await wipe(container.resolve(Modules.ORDER), "listOrders", "deleteOrders", "order", log)
  await wipe(container.resolve(Modules.PRODUCT), "listProducts", "deleteProducts", "product", log)
  await wipe(inventory, "listInventoryItems", "deleteInventoryItems", "inventory_item", log)

  console.log("\n✓ reset bitti (region/depo/kargo/müşteri korundu)\n")
}
