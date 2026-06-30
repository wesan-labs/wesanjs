# mail — Stalwart-backed personel mail kutuları   🟡 Kısmi

## Ne yapar
Merkezi Stalwart posta sunucusu üzerinden tenant staff'ına bireysel mailbox; JMAP proxy + şifreli credential.

## Tür & katman
- **Tür:** plugin (mail)
- **Katman:** domain / personel mail (Stalwart entegrasyonu)
- **tenant_id taşıyor mu:** Hayır (henüz; staff bazlı)

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 3 (MailAccount, SharedMailbox, MailSharedAccess) |
| services | 🟡 | 4 metod |
| api | 🔴 | YOK |
| admin | 🔴 | boş |
| workflows | 🔴 | YOK |
| jobs | — | yok |
| migrations | 🔴 | YOK |

Ek: lib (stalwart-client, crypto, password, local-part, reveal-store).

## Veri modeli
- **MailAccount** — user_id, local_part, address, stalwart_id, app_secret_enc, status (active|pending|suspended)
- **SharedMailbox**
- **MailSharedAccess**

## Public yüzey
- `provisionUserMailbox`
- `suspendUserMailbox`
- `createSharedMailbox`
- `getUserJmapCredential`

## Bağımlılıklar & linkler
- Dış servis: Stalwart mail server

## Durum
- **Yapılan:** backend service + modeller + Stalwart client (individual + group) + şifreli credential (reveal-once) + idempotent provisioning.
- **Yapılmayan/eksik:** API route, workflow, admin UI, migration, joiner-config.
- **Yapılacak (sıralı):**
  1. migration
  2. API (mailbox list/get/create + shared ops)
  3. provision/suspend workflow
  4. joiner-config (user relation)
  5. admin (provision form, status badge)

## Hizmet ettiği dikeyler
Tüm tenant'lar (personel mail), profesyonel hizmet.

## Kanıt yolları
- `packages/plugins/mail/src/modules/mail`
