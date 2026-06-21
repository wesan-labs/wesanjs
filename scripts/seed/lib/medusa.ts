import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Store'un default para birimini bul (seeder'lar fiyatları buna göre yazar).
export const getStoreCurrency = async (
  container: MedusaContainer
): Promise<string> => {
  const storeModule: any = container.resolve(Modules.STORE)
  // supported_currencies bir relation — açıkça yüklenmezse boş gelir ve fallback'e düşeriz.
  const stores = await storeModule.listStores(
    {},
    { relations: ["supported_currencies"], take: 1 }
  )
  const supported = stores[0]?.supported_currencies ?? []
  const def = supported.find((c: any) => c.is_default)?.currency_code
  const codes = supported.map((c: any) => c.currency_code)
  return def || (codes.includes("usd") ? "usd" : codes[0]) || "usd"
}

// İlk (default) sales channel — ürün/sipariş bağlamak için.
export const getDefaultSalesChannelId = async (
  container: MedusaContainer
): Promise<string | undefined> => {
  const scModule: any = container.resolve(Modules.SALES_CHANNEL)
  const channels = await scModule.listSalesChannels({}, { take: 1 })
  return channels[0]?.id
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
