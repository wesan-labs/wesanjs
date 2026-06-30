# draft-order — Müşteri adına sipariş (şu an SADECE admin UI)   🔴 İskelet

## Ne yapar
Admin'in müşteri adına taslak sipariş oluşturup düzenleyip göndermesi. Backend henüz yok.

## Tür & katman
- **Tür:** plugin (draft-order)
- **Katman:** admin sunum katmanı (backend yok)
- **tenant_id taşıyor mu:** Hayır

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | 🔴 | YOK |
| services | 🔴 | YOK |
| api | 🔴 | YOK |
| admin | ✅ | 87 dosya (modal/drawer/form/SDK hook/routes/lib) + types |
| workflows | 🔴 | YOK |
| jobs | — | yok |
| migrations | 🔴 | YOK |

**Backend: 0** (model/service/api/workflow/migration YOK).

## Veri modeli
- yok (planlanan: DraftOrder, DraftOrderLine, state machine)

## Public yüzey
- yok (UI mock; gerçek API'ye bağlı değil)

## Bağımlılıklar & linkler
- Medusa SDK hook (UI tarafı)
- order modülüne bağlanmamış

## Durum
- **Yapılan:** React + TS admin UI (form/modal/drawer hiyerarşisi, Medusa SDK hook, date/address/number utils + i18n data).
- **Yapılmayan/eksik:** tüm backend; order modülüne bağlanmamış.
- **Yapılacak (sıralı):**
  1. backend kararı (yeni draft-order modülü mü, order'ı extend mi)
  2. model (DraftOrder, DraftOrderLine, state machine)
  3. service (create/update/finalize/send)
  4. API (admin POST/GET/DELETE)
  5. workflow (finalize → create-order)
  6. UI'yi gerçek API'ye bağla

## Hizmet ettiği dikeyler
Mobilya (teklif), oto-servis, gıda özel sipariş, B2B.

## Kanıt yolları
- `packages/plugins/draft-order/src/admin`
