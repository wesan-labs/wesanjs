import { ExecArgs } from "@medusajs/framework/types"
import { REGISTRY } from "./registry"
import { SECTORS } from "./sectors"

// Hedefi modül id listesine çevir: "all" | "<sektör>" | "modules:a,b" | "<modül>"
const resolveIds = (target: string): string[] => {
  if (!target || target === "all") {
    return Object.keys(REGISTRY)
  }
  if (target.startsWith("modules:")) {
    return target
      .slice("modules:".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (SECTORS[target]) {
    return SECTORS[target]
  }
  return [target]
}

// dependsOn'a göre basit topolojik sıralama
const order = (ids: string[]): string[] => {
  const result: string[] = []
  const visit = (id: string, stack: Set<string>) => {
    if (result.includes(id) || stack.has(id)) {
      return
    }
    const seeder = REGISTRY[id]
    if (!seeder) {
      return
    }
    stack.add(id)
    for (const dep of seeder.dependsOn ?? []) {
      visit(dep, stack)
    }
    stack.delete(id)
    result.push(id)
  }
  ids.forEach((id) => visit(id, new Set()))
  return result
}

// Kullanım:
//   npx medusa exec ./src/seed/index.ts all
//   npx medusa exec ./src/seed/index.ts ecommerce
//   npx medusa exec ./src/seed/index.ts modules:customers 20
export default async function seed({ container, args }: ExecArgs) {
  const target = args[0] || "all"
  const count = Number(args[1]) || 12

  const ids = order(resolveIds(target))
  console.log(`\n🌱 seed: "${target}"  →  ${ids.join(", ")}\n`)

  for (const id of ids) {
    const seeder = REGISTRY[id]
    if (!seeder) {
      console.log(`  ?   ${id}: bilinmeyen, atlandı`)
      continue
    }
    if (!seeder.hasBackend) {
      console.log(`  ⏭   ${seeder.label}: backend modülü yok, atlandı`)
      continue
    }
    if (!seeder.run) {
      console.log(`  ⏭   ${seeder.label}: seeder henüz yazılmadı, atlandı`)
      continue
    }
    try {
      console.log(`  ▶   ${seeder.label}`)
      await seeder.run({
        container,
        count,
        log: (m) => console.log(`        ${m}`),
      })
    } catch (e: any) {
      console.log(`  ✖   ${seeder.label}: HATA — ${e?.message ?? e}`)
    }
  }

  console.log(`\n✓ seed bitti\n`)
}
