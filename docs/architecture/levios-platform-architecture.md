# Levios Platform — Mimari & Mühendislik Dokümanı

> **Durum:** Living document (2026-07-03)  
> **Kapsam:** Ürün modeli, katmanlar, dört ana modül, plugin sözleşmesi, modüller arası sınırlar  
> **Hedef kitle:** Platform mühendisleri, plugin yazarları, ürün kararları

Bu doküman **Levios’un ne olduğunu** ve **parçaların nasıl bir araya geldiğini** tek yerde toplar. Detaylı plugin notları `architecture/plugins/*.md` altında kalır; burada **bütün resim** ve **mühendislik kuralları** tanımlanır.

---

## 1. Ürün modeli

### 1.1 Levios ne?

**Levios**, şirketlere web tabanlı **kontrol paneli + site altyapısı** satan bir B2B SaaS platformudur.

- Dış müşteri abone olur → **kendi organizasyonunu (tenant)** alır → kendi admin’i paneli kurar.
- **Wesan**, **Nexoss** ve ileride eklenecek grup şirketleri de aynı platformda **aynı türden org** olarak yaşar.
- Müşteri, Wesan veya Nexoss’un “iç şirket” olduğunu bilmez; sistemde hepsi **eşit tenant**.

```
┌─ LEVIOS (platform — sen işletirsin) ─────────────────────────────┐
│  Satış · onboarding · billing · super-admin · altyapı            │
└───────────────────────────────┬──────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   ┌─────────┐            ┌─────────┐            ┌─────────────┐
   │  Wesan  │            │ Nexoss  │            │ Müşteri X   │
   │  (org)  │            │  (org)  │            │   (org)     │
   └─────────┘            └─────────┘            └─────────────┘
   Kendi panel            Kendi panel            Kendi panel
   Kendi site             Kendi site             Kendi site
   Kendi entegrasyonlar   …                      …
```

### 1.2 Organizasyon = izolasyon birimi

| Kavram | Teknik | Ürün dili |
|--------|--------|-----------|
| Organizasyon | `tenant` (`tenant_id`) | Şirketin çalışma alanı |
| Üyelik | `tenant_membership` | Kim bu şirkette çalışıyor |
| Aktif org | `x-tenant-id` header | Panelde “şu an hangi şirkete bakıyorum” |
| Mağaza (Store) | Medusa `store` | Commerce katmanı (ürün/sipariş); org ≠ store |

**Altın kural:** Bir org’un verisi başka org’a **asla** sızmaz — API, sorgu, cache ve (prod’da) Postgres RLS ile.

### 1.3 Kim ne görür?

| Rol | Org sayısı | Tipik deneyim |
|-----|------------|---------------|
| Dış müşteri admin’i | 1 | Switcher yok veya tek seçenek; kendi modülleri |
| Grup şirket ekibi (Wesan) | 1 | Sadece Wesan org |
| Platform super-admin (sen) | N | Tüm org’lar; destek ve provision |

---

## 2. Mimari katmanlar

Medusa v2 üzerinde **dört yatay katman** vardır. Üstten alta bağımlılık akar; feature plugin’ler birbirine **doğrudan import ile değil**, API ve ortak sözleşmelerle bağlanır.

```
┌─────────────────────────────────────────────────────────────────┐
│  KATMAN 0 — Admin UI (wesanjs/packages/admin/dashboard)         │
│  React · TanStack Query · org switcher · RBAC nav guard         │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS + session/JWT + x-tenant-id
┌───────────────────────────────▼─────────────────────────────────┐
│  KATMAN 1 — KONTROL DÜZLEMİ (Control Plane)                     │
│  tenant · rbac · [entitlement] · [billing]                      │
│  → kimlik, üyelik, scope, yetki                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │ req.tenant_id
┌───────────────────────────────▼─────────────────────────────────┐
│  KATMAN 2 — FEATURE PLUGIN'LER (domain)                       │
│  revenue · cms · content · [observability] · loyalty · …      │
│  → panelin “iş modülleri”                                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ (opsiyonel) commerce link
┌───────────────────────────────▼─────────────────────────────────┐
│  KATMAN 3 — MEDUSA COMMERCE (standart modüller)                 │
│  product · order · customer · payment · …                       │
│  → e-ticaret açık olan tenant’lar için                          │
└─────────────────────────────────────────────────────────────────┘
```

**Repo ayrımı:**

| Repo / paket | Rol |
|--------------|-----|
| `wesanjs/` | Platform kaynak kodu: plugin’ler, admin UI, core |
| `helm/` | Levios’un **deploy edilen** Medusa instance’ı; `medusa-config.js` ile plugin’leri yükler |

---

## 3. Dört ana ürün modülü

Sidebar’daki dört başlık, müşterinin günlük işini temsil eder. Hepsi **aynı tenant sözleşmesine** tabidir; içerik org değişince sıfırlanır.

### 3.1 Özet tablo

| Modül | Paket | Ana route | Ne işe yarar | Kalıcı veri |
|-------|-------|-----------|--------------|-------------|
| **Gelir (Revenue)** | `@medusajs/revenue-plugin` | `/revenue`, `/settings/connections` | RC/AdMob gelir, gider, P&L, entegrasyon matrisi | `revenue_*` tabloları |
| **CMS** | `@medusajs/cms-plugin` | `/cms` | Çok-siteli içerik: site → collection → entry, draft/publish | `cms_*` tabloları |
| **Sosyal / İçerik** | `@medusajs/content-plugin` | `/social-media`, `/content` | AI içerik stüdyosu, sosyal hesap OAuth, publish, snapshot | `content_item`, `social_snapshot` |
| **Analitik** | `@medusajs/analytics` (modül) + dashboard | `/analytics` | Ürün kullanım analitiği (şu an relay; persistence planlı) | Planlı: `analytics_event` |

**Not:** `observability` plugin (planlı) analitiğin **müşteri uygulaması BYOK** kolonudur (Sentry, Aptabase) — revenue entegrasyon matrisi ile aynı UX, farklı domain. Bkz. [observability.md](plugins/observability.md).

### 3.2 Modül sorumlulukları (sınırlar)

#### Revenue — “Para ve entegrasyonlar”

- **Sahip olduğu:** Uygulama kaydı (`RevApp`), kaynak/secret (`RevSource`), gelir olayları, günlük snapshot, gider, finance ayarları, sync job’ları.
- **Sahip olmadığı:** Public website render, sosyal post, crash/analytics SDK dağıtımı (observability).
- **Dış sistemler:** RevenueCat, AdMob, Resend (email bildirim), opsiyonel Stripe (billing — planlı).

#### CMS — “Müşterinin websitesi”

- **Sahip olduğu:** Site tanımı, koleksiyon şeması, entry (locale, draft/published), preview/publish delivery API.
- **Sahip olmadığı:** Gelir metrikleri, sosyal hesaplar, AI prompt kütüphanesi.
- **Tüketim:** Public site / headless frontend `GET /cms/:slug` ile entry çeker.

#### Content — “Sosyal medya + içerik üretimi”

- **Sahip olduğu:** `ContentItem` (AI üretimi), sosyal provider proxy (Late/Zernio), OAuth connect URL, publish, günlük `SocialSnapshot`.
- **Sahip olmadığı:** Site yapısı (CMS), abonelik geliri (revenue).
- **Önemli:** Sosyal hesaplar **tenant-scoped** olmalı; org değişince farklı hesap seti.

#### Analytics — “Panel içi kullanım & ürün analitiği”

- **Bugün:** Provider relay (`track` / `identify`) — persistence yok.
- **Hedef (ADR-0003):** Platform PostHog + GlitchTip; tenant-scoped snapshot sync → `/analytics` vertical dashboard (DAU, huni, crash özeti).
- **Ayrım:** Müşteri uygulaması verisi hosted motorlarda; Wesan panel özet gösterir. BYOK matrisi MVP'de yok.

### 3.3 Modüller arası ilişki diyagramı

```
                    ┌──────────────┐
                    │   tenant     │
                    │ (scope+RLS)  │
                    └──────┬───────┘
           tenant_id   │    │    │    tenant_id
         ┌─────────────┼────┼────┼─────────────┐
         ▼             ▼    ▼    ▼             ▼
    ┌─────────┐   ┌────────┐ ┌─────────┐  ┌───────────┐
    │ revenue │   │  cms   │ │ content │  │ analytics │
    │         │   │        │ │         │  │ (modül)   │
    │ RevApp  │   │ Site   │ │ Social  │  │ events    │
    │ P&L     │   │ Entry  │ │ AI item │  │ rollup    │
    └────┬────┘   └───┬────┘ └────┬────┘  └───────────┘
         │            │           │
         │  Ürün adı  │  Site URL │  Kampanya içeriği
         │  (gelecek) │  (link)   │  (gelecek editorial)
         └────────────┴───────────┘
              Loose coupling — ortak Product registry (planlı)
```

**Bugün:** Modüller **gevşek bağlı** — çapraz DB join yok; ortak paylaşılan tablo yok.  
**Plan (Faz 2):** `Product` / `ObsProduct` registry — revenue `RevApp` ile observability ve CMS site satırını tek “ürün” satırında birleştirmek için. Bkz. [observability.md](plugins/observability.md).

---

## 4. Kontrol düzlemi vs feature plugin

| | Kontrol düzlemi | Feature plugin |
|---|-----------------|----------------|
| **Örnek** | `tenant`, `rbac` | `revenue`, `cms`, `content` |
| **Paket tipi** | Plugin veya core modül | Plugin |
| **Sidebar** | Settings → Organization, Roles | Ana menü (Gelir, CMS, …) |
| **tenant_id** | Kaynağı tanımlar | Taşır ve filtreler |
| **Müşteriye satılır mı?** | Hayır (altyapı) | Evet (modül / plan ile) |

Detay: [control-plane.md](control-plane.md) · [ADR-0001](../adr/0001-multi-tenancy.md)

### 4.1 İstek yaşam döngüsü (her admin API çağrısı)

```
1. Auth          → actor_id (JWT / session)
2. Tenant MW     → x-tenant-id varsa membership doğrula → 403
                 → req.tenant_id, req.tenant_rbac_role_ids set
3. RBAC          → route policy (MEDUSA_FF_RBAC=true ise)
4. Handler       → service.listX({ tenant_id: req.tenant_id })
5. Postgres      → app-layer WHERE + (prod) RLS levios_app
6. Response      → yalnızca o org’un verisi
```

**Dashboard tarafı:**

- `localStorage.levios_active_tenant` + `sdk.globalHeaders['x-tenant-id']`
- Org değişince `queryClient.invalidateQueries()` + query key’de `tenantId` suffix (mühendislik kuralı)

---

## 5. Plugin anatomisi (mühendislik standardı)

Her feature plugin aynı Medusa v2 paket yapısını izler.

### 5.1 Dizin şablonu

```
packages/plugins/<name>/
├── package.json              # @medusajs/<name>-plugin
├── src/
│   ├── modules/<module>/     # Veri katmanı (tek domain modülü)
│   │   ├── models/
│   │   ├── service.ts
│   │   ├── migrations/
│   │   └── types.ts
│   ├── api/
│   │   ├── admin/            # /admin/<name>/...
│   │   └── middlewares.ts    # RBAC / route guards
│   ├── workflows/            # Mutasyon + compensation (opsiyonel)
│   ├── jobs/                 # Cron / sync (opsiyonel)
│   ├── lib/                  # Connectors, crypto, tenant-guard
│   └── index.ts              # Plugin export
└── .medusa/server/           # Build çıktısı (helm tüketir)
```

### 5.2 Katman kuralları

| Katman | Sorumluluk | Yasak |
|--------|------------|-------|
| **Model** | Tablo, `tenant_id` kolonu, index | HTTP, UI |
| **Service** | CRUD, domain hesaplama | `req` objesi okumak |
| **API route** | HTTP, validation, `req.tenant_id` ile scope | İş mantığını şişirmek |
| **Workflow** | Çok adımlı mutasyon, rollback | — |
| **Job** | Arka plan; **açıkça tenant context set** | Context’siz global scan |
| **Admin UI** | `dashboard/src/routes/<name>` | Secret’ları client’ta tutmak |

### 5.3 Yeni plugin checklist

1. [ ] `helm/medusa-config.js` → `plugins[]` içine ekle  
2. [ ] Tüm domain tablolarına `tenant_id` + index (`tenant_id`, …)  
3. [ ] Migration’da RLS policy (`levios_app` / `current_tenant_id()`)  
4. [ ] Admin route’larda `(req as any).tenant_id` ile filtre  
5. [ ] Dashboard route + `MAIN_NAV_PERMISSIONS` + i18n  
6. [ ] React Query key’lerinde `useTenantQueryKey`  
7. [ ] RBAC policy kaydı (`resource:operation`)  
8. [ ] Entitlement key (planlı) — `hasFeature(tenant, '<plugin>')`  
9. [ ] İzolasyon testi: iki org yan yana, sızıntı 0  

---

## 6. Helm’de yüklü plugin’ler (referans)

`helm/medusa-config.js` (2026-07):

```js
plugins: [
  { resolve: "@medusajs/tenant-plugin" },   // Katman 1 — zorunlu ilk
  { resolve: "@medusajs/revenue-plugin" },
  { resolve: "@medusajs/cms-plugin" },
  { resolve: "@medusajs/content-plugin" },
]
```

| Sıra | Plugin | Neden bu sıra |
|------|--------|----------------|
| 1 | `tenant` | Middleware tüm `/admin/*` isteklerini keser |
| 2–4 | revenue, cms, content | `req.tenant_id` okuyan domain plugin’leri |

**Gelecek ekleme sırası önerisi:** `observability` → `loyalty` → commerce-heavy plugin’ler.

---

## 7. Veri izolasyonu sözleşmesi

### 7.1 Defense-in-depth

| Katman | Mekanizma | Ortam |
|--------|-----------|-------|
| API | `x-tenant-id` + membership 403 | Tümü |
| App | `WHERE tenant_id = :tid` | Tümü |
| DB | RLS `tenant_id = current_tenant_id()` | Test / prod (`levios_app`) |
| Cache | Query key + tenant suffix | Dashboard |
| Secrets | `credentials_ref` + encrypt at rest | revenue, observability |

### 7.2 Legacy `tenant_id IS NULL`

Geçiş döneminde revenue route’ları `listWithLegacyTenantScope` ile null satırları birleştirebilir. **Yeni kod yazma** — yeni kayıtlar her zaman explicit `tenant_id` alır. Consolidation script: `consolidate-wesan-org`.

### 7.3 Org türleri (veri açısından eşit)

| Org | Örnek slug | Veri |
|-----|------------|------|
| Grup şirketi | `wesan-tenant`, `nexoss-tenant` | Tam set: revenue, cms, content, … |
| Dış müşteri | `acme-corp` (provision) | Aynı şema, aynı izolasyon |
| Pilot / demo | `acme`, `beta`, `default` | **Prod’da olmamalı** — sadece dev/test |

---

## 8. Yapılandırma ve secret modeli

**Müşteri asla `.env` doldurmaz.** Bu dosya yalnızca **platform operatörünün** (senin / Levios altyapısının) sunucu tarafı sırları içindir.

### 8.1 Üç katman

```
┌─ PLATFORM (.env — sadece Levios ops) ─────────────────────────────┐
│  DATABASE_URL · JWT_SECRET · KMS anahtarı                         │
│  Opsiyonel: platform Zernio key, platform S3/R2, platform Gemini    │
│  (aboneliğe dahil “included” servisler)                           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│  TENANT (panel → DB, tenant_id + secret_enc)                      │
│  RevenueCat API key · AdMob OAuth · Resend · Sentry DSN · …       │
│  UI: Ayarlar → Bağlantılar / Entegrasyonlar matrisi                │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│  SON KULLANICI (müşterinin müşterisi)                               │
│  Sadece OAuth “Instagram’a bağlan” — token sağlayıcıda kalır       │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Bugün vs hedef

| Alan | Bugün (dev) | Hedef (SaaS) |
|------|-------------|--------------|
| **RevenueCat / AdMob / Resend** | Panel + `revenue_source.secret_enc` ✅ | Aynı — referans pattern |
| **Sentry / Aptabase (observability)** | Planlı | Panel matrisi + `obs_connection.secret_enc` |
| **Sosyal (Zernio/Late)** | Global `ZERNIO_API_KEY` in `.env` 🔴 | Aşağıdaki A veya B |
| **Stüdyo görsel upload** | Global `IMAGE_HOST` + `IMGBB_API_KEY` 🔴 | Platform R2/S3 **veya** tenant BYOK |
| **AI (Gemini/OpenRouter)** | Global `.env` 🔴 | Plan dahil platform key **veya** tenant BYOK |

`.env`'deki `ZERNIO_API_KEY` ve `IMGBB_API_KEY` **geçici geliştirme kısayolu** — production SaaS'ta müşteriye açılmaz.

### 8.3 Sosyal medya — iki geçerli model

**Model A — Platform dahil (önerilen başlangıç)**  
Levios'un **tek** Zernio hesabı (platform `.env`). Her tenant için API ile **ayrı Zernio profile** oluşturulur → OAuth hesapları profile'a bağlanır → tenant izolasyonu Zernio tarafında.

```
Müşteri X org  →  zernio_profile_x  →  IG/LinkedIn hesapları
Wesan org      →  zernio_profile_wesan
```

Müşteri sadece “Instagram bağla” der; API key görmez.

**Model B — Tenant BYOK**  
Müşteri kendi Zernio/Late hesabını panelden girer → `content_connection` tablosunda `secret_enc` (revenue ile aynı crypto pattern).

Kurumsal müşteri veya “kendi aggregator'ım var” senaryosu.

### 8.4 Görsel barındırma (Instagram medya zorunluluğu)

Stüdyo `data:` URL üretir; Instagram public URL ister. Müşteri imgbb key **girmez**.

| Seçenek | Kim yapılandırır | Nasıl |
|---------|------------------|-------|
| **Platform media** (önerilen) | Levios ops | Tek R2/S3/Cloudinary platform `.env`'de; upload path `/{tenant_id}/…`; publish route tenant scope'lu upload kullanır |
| **Tenant BYOK** | Müşteri paneli | Cloudinary unsigned preset veya S3 keys → `secret_enc` |
| **Manuel URL** | Müşteri | Zaten public CDN'de olan görseli yapıştırır (her zaman çalışır) |

### 8.5 Revenue pattern (kopyalanacak şablon)

Zaten çalışan akış — diğer modüller bunu kopyalar:

```
1. Müşteri admin → Ayarlar → Bağlantılar
2. Form → POST /admin/revenue/integrations { secrets, config }
3. Backend → encryptSecret(JSON) → revenue_source.secret_enc
4. tenant_id damgası + RLS
5. Sync/job → decryptSecret(row) — process.env DEĞİL
```

Kod: `revenue/src/api/admin/revenue/integrations/route.ts` · `modules/revenue/lib/crypto.ts`

### 8.6 Content plugin yapılacaklar (task özeti)

1. `content_connection` (veya `revenue_source` genişletmesi): `provider=zernio|image_host|openrouter`, `secret_enc`, `config`
2. `late.ts` → `getSocialProvider(tenantId)` — önce tenant row, fallback platform env (dev only)
3. `image-host.ts` → `uploadImage(dataUrl, { tenantId })` — platform bucket veya tenant credentials
4. UI: Bağlantılar matrisine **Sosyal** sütunu veya Content ayarları sekmesi
5. Zernio multi-profile: tenant create workflow → `createProfile(slug)`

### 8.7 Kim ne görür?

| Secret | Platform `.env` | Tenant panel | Son kullanıcı |
|--------|-----------------|--------------|---------------|
| DB URL, JWT | ✅ | ❌ | ❌ |
| Platform Zernio (Model A) | ✅ | ❌ | ❌ |
| Tenant Zernio (Model B) | ❌ | ✅ (şifreli) | ❌ |
| RevenueCat project key | ❌ | ✅ | ❌ |
| Instagram OAuth token | ❌ | ❌ | Sağlayıcıda (Late) |

---

## 9. Admin UI eşlemesi

| Sidebar | Route | Backend prefix | Plugin |
|---------|-------|----------------|--------|
| Analitik | `/analytics` | (planlı ingest API) | analytics modül |
| Gelir | `/revenue` | `/admin/revenue` | revenue |
| CMS | `/cms` | `/admin/cms` | cms |
| Sosyal medya | `/social-media` | `/admin/content/social` | content |
| İçerik stüdyosu | `/content` | `/admin/content` | content |
| Bağlantılar | `/settings/connections` | `/admin/revenue/integrations` | revenue |
| Organizasyon | `/settings/organization` | `/admin/tenants` | tenant |

RBAC nav filtresi: `dashboard/src/lib/main-nav-permissions.ts`

---

## 10. Modüller arası entegrasyon matrisi

| Kaynak → Hedef | Bağlantı tipi | Bugün | Plan |
|----------------|---------------|-------|------|
| revenue → analytics | Event: `revenue.sync.completed` | 🔴 | Job sonrası analytics ingest |
| cms → content | Entry’den sosyal post metni | 🔴 | Editorial workflow |
| content → cms | Landing’e publish | 🔴 | Webhook / shared slug |
| revenue ↔ observability | Aynı ürün satırı (matris UI) | 🔴 | Product registry |
| tenant → hepsi | `tenant_id` scope | ✅ | — |
| rbac → hepsi | Policy guard | 🟡 | Per-tenant tam (#0007) |
| entitlement → hepsi | Feature gate | 🔴 | #0006 |

**Kural:** Modüller arası doğrudan `service.resolve(DIGER_PLUGIN)` **yasak** (sıkı coupling). Tercih: HTTP internal, domain event, veya ileride shared **read model**.

---

## 11. Onboarding akışları

### 10.1 Dış müşteri (satış sonrası)

```
Kayıt / ödeme
  → Tenant oluştur (slug, name)
  → İlk admin membership (role: admin)
  → Varsayılan RBAC rolü ata
  → [planlı] Entitlement: hangi modüller açık
  → Checklist: bağlantı · site · sosyal · ekip
```

### 10.2 Grup şirketi (Wesan / Nexoss)

```
Platform admin yeni org açar
  → Grup ekibi davet edilir
  → Entegrasyonlar bu org altında (Default’tan migrate edilmez)
```

### 10.3 Wesan vs müşteri — teknik fark

**Yok.** İkisi de `tenant` satırı. Fark yalnızca operasyonel: kim provision etti, hangi planda.

---

## 12. Gelecek mimari kararlar (açık)

| Konu | Seçenek | Öneri |
|------|---------|-------|
| Ürün kimliği | `RevApp` vs ortak `Product` | Faz 2’de registry |
| Analytics verisi | Kendi DB vs BigQuery | Önce Postgres rollup |
| Billing | revenue plugin üstü vs Stripe Billing | A5 task |
| Commerce | Her tenant’a store mı? | Entitlement ile opsiyonel |
| Multi-org kullanıcı | Holding yöneticisi | Membership çoklu; switcher |

---

## 13. İlgili dokümanlar

| Doküman | İçerik |
|---------|--------|
| [control-plane.md](control-plane.md) | Kontrol düzlemi indeksi |
| [ADR-0001](../adr/0001-multi-tenancy.md) | Multi-tenant karar kaydı |
| [onboarding/control-plane-onboarding.md](../onboarding/control-plane-onboarding.md) | Operasyon checklist |
| [plugins/tenant.md](plugins/tenant.md) | Tenant plugin detay |
| [plugins/revenue.md](plugins/revenue.md) | Revenue detay |
| [plugins/cms.md](plugins/cms.md) | CMS detay |
| [plugins/content.md](plugins/content.md) | Content detay |
| [plugins/observability.md](plugins/observability.md) | BYOK analitik broker |
| [tasks/0004](../tasks/0004-tenant-foundation.md) | Tenant foundation |
| [tasks/0007](../tasks/0007-per-tenant-rbac.md) | Per-tenant RBAC |

---

## 14. Sözlük

| Terim | Anlam |
|-------|-------|
| **Tenant / Org** | İzole veri sınırı |
| **Control plane** | Tenant + RBAC + (billing, entitlement) |
| **Feature plugin** | Satılan iş modülü (revenue, cms, …) |
| **Module** | Medusa veri modülü (plugin içinde) |
| **BYOK** | Bring your own key — müşteri kendi Sentry/RC hesabı |
| **RLS** | Row-level security — DB sigortası |

---

## Changelog

| Tarih | Değişiklik |
|-------|------------|
| 2026-07-05 | §8.1 Model A — tenant Zernio profile, platform IMAGE_HOST |
| 2026-07-05 | §8 Yapılandırma modeli — .env vs tenant panel, sosyal/görsel hedef |
| 2026-07-03 | İlk sürüm — ürün modeli, 4 modül, plugin sözleşmesi, izolasyon |
