# wesanjs — Panel Platform Spec (v0, review'e açık)

> Bu bir SPEC'tir, kod değil. Amaç: başlamadan önce **ne nereye gelecek + nasıl ayağa kalkacak** netleşsin.
> Kaynak: temiz Medusa fork'u (`develop`, 10.202 commit, full upstream history). Rebrand EN SONDA.

---

## 1. Durum — ne yapıldı / yapılmadı (dürüst envanter)

**Yapıldı:**
- Medusa → `wesanjs` fork. Yer: `/Users/canakyuz/Developer/wesan/levios/wesanjs`, branch `develop`, temiz.
- Remote: `git@github.com:wesan-labs/wesanjs.git` (PUBLIC, tam Medusa geçmişiyle → ileride upstream merge mümkün).
- Tasarım kararları konuşuldu (aşağıda).

**YAPILMADI (kritik):**
- ❌ `yarn install` çalışmadı — hiçbir bağımlılık kurulu değil.
- ❌ Docker / docker-compose / .env YOK (kökte hiçbiri).
- ❌ Postgres / Redis yok, hiçbir şey ayakta değil.
- ❌ Çalıştırılabilir host app YOK. **Bu monorepo runnable değil** — framework monorepo'su; root script'leri sadece `build/lint/test`. Çalışan config yalnızca `integration-tests/`'te (test amaçlı).

**Sonuç:** İlk iş kod değil — **çalışan bir iskele** (host app + DB + docker). Plugin yazmadan önce boş bir wesanjs admin'i `:9999/app`'te ayağa kalkmalı.

---

## 2. Hedef & Model

wesanjs = Medusa (commerce) çekirdeği üstüne **çok-domainli panel platformu.** Medusa'nın native modeli bunu zaten destekliyor:
- **Uygulama = `medusa-config.ts`'teki `modules[]` + `plugins[]`** (deklaratif kompozisyon; modüller `link-modules` ile decoupled).
- **Her panel birimi = tam-yığın self-contained plugin** (plugin İÇİNDE `src/{modules,api,admin,workflows}`). Kanıt: Medusa `plugins/loyalty`.
- **"Panel tipi" = preset** = küratörlü plugin/modül listesi (Medusa çekirdeğinde preset kavramı YOK; ince katman olarak biz ekleriz).

**Helm = Can'ın kendi paneli** = en zengin kompozisyon (app-management + ads + **crm + cms** + analytics + rbac). crm/cms Helm'e gömülmez — bağımsız plugin'dir, Helm onları kompoze eder; aynı crm/cms yarın standalone panel olarak da satılır.

---

## 3. Mimari Kararlar (kilitli)

| # | Karar |
|---|---|
| K1 | Scope: şimdilik dokunma; **rename EN SONDA** (`@medusajs/* → @wesanjs/*` toplu). |
| K2 | Preset = küratörlü `plugins[]`+`modules[]` listesi (motor değil). |
| K3 | Yeni shell YOK. Tek dashboard shell + plugin enjeksiyonu. commerce taşınmaz; gerekirse preset-aware mount. |
| K4 | Backend plugin İÇİNDE (`plugins/x/src/modules`) — Medusa native, `loyalty` kanıtı. |

---

## 4. Ne Nereye Gelecek

```
wesanjs/
├── apps/
│   └── host/                  # ★ ÇALIŞTIRILABİLİR Medusa app (dogfood backend)
│       ├── medusa-config.ts   #   plugins:[...helm preset] — shell'i :9999/app'te servis eder
│       └── .env               #   DATABASE_URL, REDIS_URL, secrets
│
├── packages/plugins/
│   ├── app-management/        # HELM'e özel: App kaydı (mobil/oyun) + dijital satış
│   ├── ads/                   # HELM'e özel: reklam geliri (admob/applovin)
│   ├── crm/                   # BAĞIMSIZ: contact/company/opportunity/pipeline (Twenty'den)
│   └── cms/                   # BAĞIMSIZ: içerik JSON editörü (hero/başlık/blok — ürün YOK)
│       # her plugin: src/{modules, api/admin, admin/{routes,widgets}, workflows} + package.json exports
│
├── packages/cms-renderer/     # PANEL DEĞİL — ön-yüz JSON renderer
│   ├── core/  web/(React)  native/(RN-Expo)
│
└── docker-compose.yml         # postgres + redis (dev altyapı)
```

Mevcut Medusa (`packages/{core,modules,admin,cli,...}`) = DOKUNMA, yeniden kullan.

**Preset = ayrı klasör DEĞİL.** Medusa'da kompozisyon native olarak config'deki düz `plugins[]`'tir (plugin→plugin geçişli bağımlılık yok — `resolvePlugin` kanıtı). "Panel tipi" = host app'in `plugins[]` listesi:

```ts
// apps/host/medusa-config.ts  →  "helm preset" = bu liste
plugins: [
  { resolve: "@wesanjs/app-management" },
  { resolve: "@wesanjs/ads" },
  { resolve: "@wesanjs/crm" },
  { resolve: "@wesanjs/cms" },
]
// CRM-only panel = başka host app, plugins:[{resolve:"@wesanjs/crm"}]
```
İleride 2+ app aynı listeyi paylaşırsa (DRY) `packages/presets/<tip>` = sadece bu diziyi export eden ince veri paketi olur. Şimdi YAGNI — yok.

---

## 5. Altyapı (Docker + DB)

Medusa **Postgres zorunlu**; Redis opsiyonel (dev'de inmemory cache/event-bus/workflow var, prod-like için redis).

```yaml
# docker-compose.yml (dev)
services:
  postgres:  # postgres:16, db=wesanjs, port 5432
  redis:     # redis:7, port 6379 (opsiyonel)
```
```
# apps/host/.env
DATABASE_URL=postgres://wesanjs:wesanjs@localhost:5432/wesanjs
REDIS_URL=redis://localhost:6379
PORT=9999            # Helm :9999/app (Medusa default 9000'i override eder)
```
Akış: `docker compose up -d` → `yarn install` → `medusa db:migrate` → `medusa develop` → `:9999/app` (boş admin).

---

## 6. Başlangıç Sırası (fazlar)

- **FAZ 0 — İskele/altyapı:** docker (pg+redis) + `apps/host` (create-medusa-app) + .env + install + migrate + run. **Kabul:** boş wesanjs admin `:9999/app`'te açılıyor.
- **FAZ 1 — `app-management`:** App modeli + Apps sayfası (loyalty şablonu). **Kabul:** Apps menüde görünüyor.
- **FAZ 2 — `ads`:** gelir widget'ı → **helm preset v0 = app-management + ads** çalışır.
- **FAZ 3 — `crm`:** Twenty analizi → contact/company/opportunity → helm preset'e eklenir.
- **FAZ 4 — `cms` + `cms-renderer`:** içerik JSON editörü + web/native render → helm preset'e eklenir.

---

## 7. Açık Kararlar (review'de sen vereceksin)

- **D1 — crm/cms kapsamı:** tam bağımsız/standalone-satılık baştan mı, yoksa önce Helm'in ihtiyacı kadar yazıp sonra mı genelleştirelim? (YAGNI: ikincisi hızlı.)
- **D2 — app-management + ads:** ayrı 2 plugin mi, tek `helm-core` mı? (öneri: ayrı = daha modüler.)
- **D3 — host app + port:** ✅ KARAR: `apps/host`, port **9999** (`PORT=9999` env ile; Helm → `:9999/app`).
- **D4 — rename zamanı:** kesinleşti = EN SONDA.
