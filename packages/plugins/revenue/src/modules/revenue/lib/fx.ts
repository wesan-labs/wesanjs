// Backend FX — Frankfurter (ECB, anahtarsız), 1 saat in-memory cache.
// Frankfurter yalnız ECB para birimlerini destekler; desteklenmeyen/başarısız
// durumda son bilinen kuru ya da 1 döner (hesap bozulmasın).
const cache = new Map<string, { rate: number; ts: number }>()
const TTL = 60 * 60 * 1000

export async function rateTo(from: string, to: string): Promise<number> {
  const f = from.toUpperCase()
  const t = to.toUpperCase()
  if (f === t) {
    return 1
  }
  const key = `${f}->${t}`
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < TTL) {
    return hit.rate
  }
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${f}&symbols=${t}`
    )
    if (!res.ok) {
      return hit?.rate ?? 1
    }
    const data: any = await res.json()
    const rate = data?.rates?.[t]
    if (typeof rate === "number") {
      cache.set(key, { rate, ts: now })
      return rate
    }
    return hit?.rate ?? 1
  } catch {
    return hit?.rate ?? 1
  }
}
