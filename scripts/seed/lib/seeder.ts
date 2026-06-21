import { MedusaContainer } from "@medusajs/framework/types"

export type SeedContext = {
  container: MedusaContainer
  count: number
  log: (msg: string) => void
}

// Her modülün seed birimi. Sektörler bunların kompozisyonu.
// hasBackend=false → modül backend'i yok (UI kabuğu), seed edilemez.
// run yok → backend var ama seeder henüz yazılmadı (pending).
export type Seeder = {
  id: string
  label: string
  dependsOn?: string[]
  hasBackend: boolean
  run?: (ctx: SeedContext) => Promise<void>
}
