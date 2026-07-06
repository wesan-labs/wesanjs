# 0011 — Content Studio Pack & Template Engine

| | |
|---|---|
| **Durum** | 📋 Backlog (mimari onaylandı, implementasyon bekliyor) |
| **Öncelik** | Yüksek |
| **Kapsam** | **Faz 0-3** — engine'i furniture ile uçtan uca kanıtla. Genişleme ayrı task'lara bölündü (↓ Sonraki task'lar): #0013 pack genişleme · #0014 pack-tenant · #0015 L3 RAG |
| **Etiket** | content-studio · ai · packs · template-engine |
| **Mimari spec** | [content-studio-pack-engine.md](../architecture/content-studio-pack-engine.md) |
| **Ürün niyeti** | [content-studio.md](../../../helm/docs/content-studio.md) |
| **Referans kod** | Bega Home `scripts/generate-*.ts` → **Faz 0'da repoya çıkarılır** (T9 disk bağımlılığı kesilir) |
| **İlgili** | #0012 Marka Kimliği (Adım ⓪ — `brand_profile` bu engine'i L2 metadata olarak besler) · #0004/#0005 tenant/RLS |

## Amaç

İçerik Stüdyosu görsel pipeline'ını **generic 333-prompt kütüphanesinden** çıkarıp Bega Home'un kanıtlanmış **Pack + Template Engine** mimarisine taşımak:

- Deterministik `fillTemplate` (LLM prompt yazmaz)
- Kategori × shot seçimi (119 kart yerine ~24-40 anlamlı seçenek)
- Referans görsel + fidelity prefix + tek hop Gemini
- Multi-tenant pack merge (iskele; tam iş #0014)
- RAG **yok** (çekirdekte); opsiyonel L3 sonra (#0015)

> ▎ **Bu task yalnızca Faz 0-3.** Amaç: mühendislik tezini (deterministik > LLM-in-the-loop) **tek bir dikey dilimle** (mobilya) uçtan uca kanıtlamak. Tüm sektör pack'leri, tam Bega port, tenant ve RAG bilinçli olarak sonraki task'lara ertelendi — "çalışan dilim önce."

## Bitti sayılır (Faz 0-3 kapsamı)

Sayılar tek-kaynak; kodla doğrulanmış mevcut durum: `prompt-library.data.json` = 333 prompt / **96 image-prompt**; `sector-packs.ts` = 31 prompt (23 image + 8 video); UI'da görünen görsel kart = **119** (96 library + 23 sector).

- [ ] Mimari doküman onaylı (`content-studio-pack-engine.md`)
- [ ] Plugin helm'e build/link edildi — `compose`/`edit-image` uçtan uca test edilebilir (Faz 0/2 ön-koşulu)
- [ ] Bega Home template stringleri + `product-catalog.json` **repoya çıkarıldı** (T9 mount'suz da port çalışır)
- [ ] `lib/packs/` engine + template-engine yazıldı, unit test geçer
- [ ] **Determinism kanıtı:** aynı `packId/categoryId/shotId/metadata` → 2 compose → **byte-identical** instruction (kredisiz, mimari doğrulandı milestone'u)
- [ ] `POST /compose` deterministik instruction döndürüyor (görsel model çağrısı yok)
- [ ] `edit-image` pack instruction ile **tek hop** çalışıyor (LLM ara katman yok)
- [ ] **2 pack yüklü:** `begahome-furniture` (dikey dilim) + `mobile-game-ua` (engine generic mi kanıtı — sector-packs reshape)
- [ ] UI: sector → category → shot (pack-first) furniture için çalışır; prompt kart şeridi görsel adımında yok
- [ ] Legacy görünürlük: `prompt-library.data.json` image-prompt **UI'da görünen sayısı 96 → 0** (gizle/deprecated flag; dosya silinmesi #0013'te)
- [ ] Vision analyze → pack/category önerisi bağlı

---

## Faz 0 — Dokümantasyon, karar & kurulum

**Hedef:** İş başlamadan önce test edilebilirliği ve bağımsızlığı garanti et.

- [x] Mimari spec yazıldı
- [ ] **Plugin build/link → helm** (`packages/plugins/content` helm `node_modules`'a sync). **Neden burada:** Faz 2 curl ve Faz 3 UI çıkış kriterleri plugin helm'de çalışmadan doğrulanamaz. Cleanup değil, ön-koşul.
- [ ] **Bega Home extraction:** `/Volumes/T9/.../begahome/scripts/generate-*.ts` içindeki 6 kategori × 4 shot template stringleri + `product-catalog.json` şeması repoya kopyala (`lib/packs/data/` ham girdi). **Neden:** T9 harici disk; port bir daha mount'a bağlı kalmasın.
- [ ] ADR-0004: Template Engine vs RAG kararı (opsiyonel)
- [ ] `content.md` plugin doc güncelle (pack engine linki)
- [ ] `helm/docs/content-studio.md` §8 envanter güncelle (yeni yön)

## Faz 1 — Pack loader & template engine (çekirdek) ★ milestone

**Hedef:** L1 katman; UI/API yok, unit test ile doğrula. **Bu faz kredisiz tamamen kanıtlanabilir** — görsel model, OpenRouter, Gemini gerektirmez; saf string kompozisyonu.

- [ ] `lib/packs/loader.ts` — pack JSON yükle, sector index
- [ ] `lib/packs/template-engine.ts` — `composeInstruction()`, token fill
- [ ] `lib/packs/resolvers/furniture.ts` — Bega Home `getSurface`, `getNestCount`, `getSofaColor`…
- [ ] `lib/packs/data/begahome-furniture.pack.json` — 6 kategori × 4 shot (Faz 0'da çıkarılan metinler)
- [ ] `lib/packs/resolvers/mobile-game.ts` — stub + 2-3 resolver
- [ ] `lib/packs/data/mobile-game-ua.pack.json` — `sector-packs.ts`'den migrate (ilk 8 shot; reshape, yeni yazım değil)
- [ ] Pack merge: `defaultPack + tenantOverride` interface (implementasyon stub OK — tam iş #0014)
- [ ] Unit test: `zigon/walnut/tapered` + `lifestyle` → beklenen instruction substring'leri
- [ ] **Determinism testi:** aynı metadata → 10 compose → byte-identical string

> ▎ **Faz 1 = "mimari doğrulandı" milestone'u.** Byte-identical determinism, tüm epiğin mühendislik tezidir (mimari spec §11: template = aynı input → aynı prompt; RAG = chunk değişir → prompt değişir). Kredisiz ispatlanır. Buraya kadar geldiğinde mimari kanıtlanmıştır; gerisi (fidelity) krediye bekler.

**Çıkış kriteri:** `bun test packs/template-engine` geçer + determinism testi yeşil.

## Faz 2 — API & edit-image refactor

**Ön-koşul:** Faz 0 build/link tamam (plugin helm'de çalışıyor).

- [ ] `GET /admin/content/packs` — list packs, categories, shots (facet meta)
- [ ] `POST /admin/content/compose` — preview instruction (no image call)
- [ ] `edit-image/route.ts` — `instruction` field birincil; `promptId` deprecated branch (2-hop LLM expansion görsel için devre dışı)
- [ ] `prompt-library.ts` — `listPrompts({ content_type: image-prompt })` legacy flag veya boş dön
- [ ] `sector-packs.ts` — pack JSON'a taşındıktan sonra thin re-export veya sil

**Çıkış kriteri:** curl ile compose (kredisiz) + edit-image uçtan uca (GEMINI_API_KEY veya OpenRouter free fallback).

## Faz 3 — UI pack-first (görsel adımı)

- [ ] `PackPicker` component: sector (analizden seed) → category chips → shot chips
- [ ] Deterministik önizleme paneli (`compose` API); LLM "örnek" butonu kaldır (görselde)
- [ ] `PromptLibrarySection` görsel `kind` için devre dışı veya sadece metin
- [ ] "Tümü" sector filter kaldır (görsel)
- [ ] Step strip: Seç shot → Kontrol et → Üret
- [ ] Kart şeridi (119 image-prompt) → shot listesi (4-5 item per category)

**Çıkış kriteri:** Mobilya görseli yükle → zigon → lifestyle → üret → kaydet. **Bu dilim #0011'in "bitti"sidir.**

---

## Sonraki task'lar (bu #0011'den bölündü)

Aşağıdakiler bilinçli olarak ayrıldı — #0011 önce çekirdeği kanıtlar, sonra bunlar sırayla açılır.

### #0013 — Pack genişleme (eski Faz 4-5)

- Bega Home furniture **tam port**: `product-catalog.json` → pack catalog mapping, Medusa product `metadata` sync, `generate-seating.ts` STRICT IDENTITY → `kanepe`/`berjer`/`kose` fidelity, `content-pack-batch` job (progress.json), `regenerate-fix.ts` → retry UI
- Diğer sektör pack'leri: `mobile-app-aso`, `saas-web-social`, kalan `mobile-game-ua` shot'ları
- Her pack: min 4 shot, transform-first; vision analyze field mapping tablosu
- `prompt-library.data.json` 96 image-prompt **dosyadan sil** (`archive/`)
- **Çıkış:** 4 sektörde en az 1 category × 4 shot çalışır

### #0014 — Pack-tenant (eski Faz 6'nın pack kısmı)

- Pack entitlement: hangi tenant hangi `pack_id` görür
- `tenant_id` on ContentItem metadata (packId, shotId); `pack_configs` RLS
- **Bağımlılık:** #0004 tenant foundation, #0005 RLS (content plugin)
- **Not:** `brand_profiles` tablosu **#0014'te değil, #0012 Faz 3'te** — marka kimliği kendi task'ı, tablosu da onun.

### #0015 — L3 Enrichment (opsiyonel RAG, eski Faz 8)

- Brand book PDF upload + chunk + retrieve
- Caption adımında RAG seasoning (görsel pipeline'a dokunma)
- Performans hook bankası (data_banks mevcut JSON'dan)
- **Not:** Pack Engine (#0011) tamamlanmadan başlamaz.

---

## Görev dökümü (özet tablo — sadece #0011 kapsamı)

| ID | Görev | Faz | Tahmini |
|----|-------|-----|---------|
| T0a | Plugin build/link → helm | 0 | S |
| T0b | Bega Home extraction (repoya) | 0 | S |
| T1 | Pack JSON şema + loader | 1 | M |
| T2 | template-engine + furniture resolvers | 1 | M |
| T3 | begahome-furniture.pack.json | 1 | S |
| T4 | Unit tests + determinism (★ milestone) | 1 | S |
| T5 | GET /packs, POST /compose | 2 | S |
| T6 | edit-image refactor (tek hop) | 2 | M |
| T7 | PackPicker UI | 3 | L |
| T8 | Görsel prompt library gizle (96→0 görünür) | 3 | S |

S = küçük · M = orta · L = büyük · Genişleme görevleri (T9-T13) → #0013/#0014/#0015

---

## Bağımlılıklar

- Content plugin mevcut (`packages/plugins/content`)
- **Plugin build/link → helm** (Faz 0 — test edilebilirlik ön-koşulu)
- `GEMINI_API_KEY` veya OpenRouter free fallback — Faz 2-3 görsel doğrulama için (Faz 1 kredisiz)
- Bega Home scripts — **Faz 0'da repoya çıkarıldıktan sonra bağımsız** (T9 mount'a bağlı değil)
- #0012 Marka Kimliği — Faz 3 auto-fill için faydalı ama zorunlu değil (engine fixture ile çalışır)

## Risk

- UI değişikliği büyük (119 kart → shot picker) — kullanıcı alışkanlığı
- Pack JSON bakım yükü — resolver'ları TS'te tutarak minimize et
- Geçiş döneminde iki sistem paralel — feature flag `CONTENT_PACK_ENGINE=1`
- **Fidelity krediye bağlı:** "Bega Home seviyesi" iddiası GEMINI_API_KEY + gerçek üretim ister; Faz 2-3'e kadar doğrulanamaz. Faz 1 determinism bu riskten bağımsız.

---

## Test planı

1. **Determinism (★, kredisiz):** Aynı `packId/categoryId/shotId/metadata` → 10 compose → identical string
2. **Fidelity:** Bega Home ürün #1 referans + zigon lifestyle → görsel karşılaştırma (manuel, kredi gerekli)
3. **Sector routing:** Oyun ekranı analyze → mobile-game pack önerilir, furniture prompt yok
4. **Regression:** Metin adımı (caption) hâlâ prompt library ile çalışır
5. **Deprecation:** Eski `promptId` image çağrısı uyarı loglar, çalışmaya devam eder (#0013'e kadar)

---

*Oluşturulma: 2026-07-06 · Revizyon: 2026-07-06 (5 düzeltme + Faz 1-3'e daraltma + #0012 bağı)*
