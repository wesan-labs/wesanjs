// Paylaşılan sahte-veri üreteçleri (deterministik — index bazlı, tekrar
// edilebilir, idempotency'ye uygun). Tüm seeder'lar buradan besler → DRY.

const FIRST = [
  "Ada", "Mert", "Elif", "Can", "Zeynep", "Deniz", "Ece", "Kaan",
  "Naz", "Ali", "Selin", "Emre", "Yusuf", "Defne", "Arda", "Mira",
]
const LAST = [
  "Yılmaz", "Demir", "Şahin", "Çelik", "Koç", "Aydın", "Arslan",
  "Doğan", "Kaya", "Öztürk",
]

// E-posta yerel kısmı ASCII olmalı (Medusa email doğrular).
const ascii = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/[^a-z]/g, "")

export const fakeCustomer = (i: number) => {
  const first = FIRST[i % FIRST.length]
  const last = LAST[(i * 3) % LAST.length]
  return {
    first_name: first,
    last_name: last,
    email: `${ascii(first)}.${ascii(last)}${i}@levios.dev`,
  }
}
