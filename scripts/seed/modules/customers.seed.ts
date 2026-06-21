import { Modules } from "@medusajs/framework/utils"
import { fakeCustomer } from "../lib/fixtures"
import { Seeder } from "../lib/seeder"

export const customersSeeder: Seeder = {
  id: "customers",
  label: "CRM — müşteriler + gruplar",
  hasBackend: true,
  async run({ container, count, log }) {
    const customerModule: any = container.resolve(Modules.CUSTOMER)

    // Müşteriler — idempotent (aynı e-posta varsa atla, tekrar basınca çoğaltmaz)
    const data = Array.from({ length: count }, (_, i) => fakeCustomer(i))
    const emails = data.map((c) => c.email)
    const existing = await customerModule.listCustomers(
      { email: emails },
      { select: ["email"] }
    )
    const seen = new Set(existing.map((c: any) => c.email))
    const toCreate = data.filter((c) => !seen.has(c.email))
    if (toCreate.length) {
      await customerModule.createCustomers(toCreate)
    }
    log(`müşteri: +${toCreate.length} (zaten ${seen.size})`)

    // Müşteri grupları — idempotent
    const groupNames = ["VIP", "Toptan", "Yeni"]
    const existingGroups = await customerModule.listCustomerGroups(
      { name: groupNames },
      { select: ["name"] }
    )
    const seenGroups = new Set(existingGroups.map((g: any) => g.name))
    const groupsToCreate = groupNames
      .filter((n) => !seenGroups.has(n))
      .map((name) => ({ name }))
    if (groupsToCreate.length) {
      await customerModule.createCustomerGroups(groupsToCreate)
    }
    log(`grup: +${groupsToCreate.length} (zaten ${seenGroups.size})`)
  },
}
