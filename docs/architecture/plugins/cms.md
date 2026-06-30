# cms — Çok-siteli içerik (site/collection/entry) draft/publish   🟡 Kısmi

## Ne yapar
Siteler içinde collections ve entries; draft/published durum; preview + publish ortamı.

## Tür & katman
- **Tür:** plugin (cms)
- **Katman:** domain / içerik yönetimi (çok-siteli)
- **tenant_id taşıyor mu:** Hayır

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 3 (CmsSite, CmsCollection, CmsEntry) |
| services | ✅ | auto-CRUD service |
| api | ✅ | 3 route |
| admin | 🔴 | boş |
| workflows | ✅ | 2 (create-cms-site, update-cms-entry compensation'lı) |
| jobs | — | yok |
| migrations | 🔴 | YOK |

## Veri modeli
- **CmsSite** — slug, locales
- **CmsCollection**
- **CmsEntry** — status (draft/published)

## Public yüzey
- `GET/POST /admin/cms/sites`
- `GET /sites/:id`
- `POST /admin/cms/entries/:id`

## Bağımlılıklar & linkler
- yok (kayda değer dış bağımlılık/env yok)

## Durum
- **Yapılan:** model + service (auto-CRUD) + 2 workflow + temel API, build alınmış.
- **Yapılmayan/eksik:** **migration HİÇ YOK → boot'ta tablo kurmaz (çalışmaz)**; admin UI boş; collections API yok (model var, route yok).
- **Yapılacak (sıralı):**
  1. migration yaz (site/collection/entry DDL)
  2. collections API
  3. admin UI

## Hizmet ettiği dikeyler
Emlak (ilan), perakende/DTC (landing/lookbook), eğitim (ders hiyerarşi).

## Kanıt yolları
- `packages/plugins/cms/src/modules/cms`
