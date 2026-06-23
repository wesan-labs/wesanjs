import { useQuery } from "@tanstack/react-query"
import { useStore } from "../../../hooks/api/store"
import { getStylizedAmount } from "../../../lib/money-amount-helpers"

// Store ayarındaki (default) para birimi — gösterim HER ZAMAN buna göre.
const useDisplayCurrency = (): string | undefined => {
  const { store } = useStore()
  return store?.supported_currencies?.find((c) => c.is_default)?.currency_code
}

// Canlı kur — Frankfurter (ECB verisi, anahtarsız, CORS açık). TTL 1 saat: cache şart,
// yoksa her render dış API'yi çağırır → P95 ölür. TanStack Query cache'i hallediyor.
const useFxRate = (from?: string, to?: string) => {
  const f = from?.toUpperCase()
  const t = to?.toUpperCase()

  return useQuery({
    queryKey: ["fx-rate", f, t],
    queryFn: async () => {
      if (!f || !t || f === t) {
        return 1
      }
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=${f}&symbols=${t}`
      )
      if (!res.ok) {
        return null
      }
      const data = await res.json()
      return (data?.rates?.[t] as number | undefined) ?? null
    },
    enabled: Boolean(f) && Boolean(t),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
  })
}

type MoneyProps = {
  amount?: number | null
  currency?: string | null
}

/**
 * Tutarı HER ZAMAN store ayar para biriminde gösterir.
 *  - veri para birimi == ayar  → gerçek fiyat (çevirme yok)
 *  - farklı                    → canlı kur ile çevir, "≈" ile işaretle (yaklaşık)
 *  - kur alınamaz/yükleniyor   → ham fiyatı bozmadan göster
 * Çevrilen tutar SADECE görüntüde; DB'ye yazılmaz (kur dalgalanır, muhasebe bozulur).
 */
export const Money = ({ amount, currency }: MoneyProps) => {
  const displayCurrency = useDisplayCurrency()

  const from = currency ?? undefined
  const to = displayCurrency ?? from
  const sameCurrency = !from || !to || from.toUpperCase() === to.toUpperCase()

  const { data: rate, isLoading } = useFxRate(
    sameCurrency ? undefined : from,
    sameCurrency ? undefined : to
  )

  if (amount == null || !from) {
    return <>—</>
  }

  // Aynı para birimi → gerçek fiyat
  if (sameCurrency) {
    return (
      <span className="whitespace-nowrap tabular-nums">
        {getStylizedAmount(amount, from)}
      </span>
    )
  }

  // Farklı + kur geldi → çevrilmiş, "≈" ile (orijinali title'da)
  if (rate != null) {
    return (
      <span
        className="whitespace-nowrap tabular-nums"
        title={getStylizedAmount(amount, from)}
      >
        ≈ {getStylizedAmount(amount * rate, to as string)}
      </span>
    )
  }

  // Kur yükleniyor / alınamadı → ham fiyat (bozma)
  return (
    <span
      className="whitespace-nowrap tabular-nums"
      title={isLoading ? "kur yükleniyor…" : "kur alınamadı"}
    >
      {getStylizedAmount(amount, from)}
    </span>
  )
}
