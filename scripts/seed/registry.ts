import { Seeder } from "./lib/seeder"
import { commerceFoundationSeeder } from "./modules/commerce-foundation.seed"
import { customersSeeder } from "./modules/customers.seed"
import { ordersSeeder } from "./modules/orders.seed"
import { productsSeeder } from "./modules/products.seed"

// Stub: backend yok ya da seeder henüz yazılmadı (run yok).
const stub = (id: string, label: string, hasBackend: boolean): Seeder => ({
  id,
  label,
  hasBackend,
})

// Tüm modül seeder'ları. Yeni modül = buraya bir satır.
export const REGISTRY: Record<string, Seeder> = {
  // Hazır:
  "commerce-foundation": commerceFoundationSeeder,
  customers: customersSeeder,
  products: productsSeeder,
  orders: ordersSeeder,

  // Backend modülü YOK (UI kabuğu — modül yazılınca seeder eklenir):
  sms: stub("sms", "SMS", false),
  social: stub("social", "Sosyal medya", false),
  subscriptions: stub("subscriptions", "Abonelikler", false),
  "ad-revenue": stub("ad-revenue", "Reklam geliri", false),
  hms: stub("hms", "Hastane yönetimi", false),
  hotel: stub("hotel", "Otel yönetimi", false),
}
