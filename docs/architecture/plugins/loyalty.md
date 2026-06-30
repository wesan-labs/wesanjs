# loyalty — Hediye kartı + store-credit (dijital cüzdan)   ✅ Çalışır

## Ne yapar
Admin'den gift-card yarat → müşteri webhook'la talep et → store-credit'e yükle → siparişte düş. Uçtan-uca biten tek plugin.

## Tür & katman
- **Tür:** plugin (loyalty)
- **Katman:** domain / sadakat (gift-card + dijital cüzdan)
- **tenant_id taşıyor mu:** Hayır (henüz multi-tenant scope'a bağlanmamış)

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 3 (GiftCard, StoreCreditAccount, AccountTransaction) |
| services | ✅ | store-credit service 20+ metod |
| api | ✅ | 12 route |
| admin | ✅ | 40+ admin tsx |
| workflows | ✅ | 12 workflow |
| jobs | — | yok |
| migrations | ✅ | 15 migration |

Ek: 2 modül (loyalty, store-credit) · 5 Module Link · 1 subscriber.

## Veri modeli
- **GiftCard** — code (unique), status (PENDING|ACTIVE|REDEEMED|CANCELLED), value (bigNumber), currency, expires_at, reference_id, line_item_id, note
- **StoreCreditAccount** — customer_id, balance, credits, debits, status
- **AccountTransaction** — account_id, type, amount, reference

## Public yüzey
- **store-credit service:** 20+ metod — `creditAccount`, `debitAccount`, `retrieveAccountStats`, `claimStoreCreditAccount`
- **Workflows:** `claim-gc` (150 satır), `redeem-gc` (201 satır, balance-check)
- **API:**
  - admin: store-credit-accounts CRUD + credit + transactions
  - store: gift-cards/[code] + claim + redeem
  - cart: gift-card / store-credit hooks

## Bağımlılıklar & linkler
- 5 Module Link (loyalty ↔ store-credit ↔ customer/order/cart)
- 1 subscriber
- Dış servis / env: yok

## Durum
- **Yapılan:** model + service + workflow + api + admin hepsi entegre, çalışır.
- **Yapılmayan/eksik:** bignumber precision (şu an `Number()`), refund (order-cancel → restore yok), expiry validation, email bildirim, admin customer filter (TODO).
- **Yapılacak (sıralı):**
  1. bignumber → decimal.js
  2. refund workflow
  3. expiry checkout step
  4. admin filter
  5. email
  6. bulk CSV import

## Hizmet ettiği dikeyler
Kuaför/estetik (hediye kartı), DTC moda, perakende, el yapımı.

## Kanıt yolları
- `packages/plugins/loyalty/src/modules/loyalty`
- `packages/plugins/loyalty/src/modules/store-credit/service.ts`
- `packages/plugins/loyalty/src/workflows`
- `packages/plugins/loyalty/src/admin`
