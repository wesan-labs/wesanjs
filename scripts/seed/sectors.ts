// Sektör = modül seeder'larının kompozisyonu. Dispatcher bunları çözer.
// Yeni sektör eklemek = sadece buraya bir satır.
export const SECTORS: Record<string, string[]> = {
  ecommerce: ["products", "customers", "orders"],
  "saas-sahibi": ["customers", "sms", "social", "subscriptions", "ad-revenue"],
  "estetik-merkezi": ["hms", "customers", "social"],
  otel: ["hotel", "customers"],
}
