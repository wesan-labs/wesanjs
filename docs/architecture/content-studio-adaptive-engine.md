# Content Studio — Adaptive Brand Engine (Mimari v2)

> **Durum:** Taslak mimari (2026-07-06) · **Supersedes:** [content-studio-pack-engine.md](./content-studio-pack-engine.md) (v1 — furniture/pack-first; aşağıda §1'de neden yetersiz kaldığı)
> **Bağlam:** İçerik Stüdyosu'nu *tek dikey (mobilya)* için kurulmuş ezberci pack modelinden, **keyfi sayıda müşteri alanına** genelleşen adaptif, marka-güdümlü bir motora taşımak.
> **İlgili:** [content-studio ürün niyeti](../../../helm/docs/content-studio.md) · [#0011 pack engine](../tasks/0011-content-studio-pack-engine.md) · [#0012 marka kimliği](../tasks/0012-brand-identity.md) · [content plugin](./plugins/content.md)
> **Araştırma dayanağı:** 3 paralel araştırma (OSS image editor · OSS video editor · adaptif marka-güdümlü generation). Kaynaklar §15.

---

## 0. Tek cümle

Kullanıcı **markasını bir kez kurar** (`BrandIdentity`); sistem o markadan tenant başına **bir kez bir Pack DERLER ve DONDURUR**; sonra her üretim bu donmuş pack'ten **deterministik** (~0ms, byte-identical) talimat üretir, **gömülü editörle** rötuşlanır, yayına gider. LLM her istekte oturmaz — yalnızca `BrandIdentity → Pack` **derleyicisidir**.

---

## 1. Neden v1 (pack-first) yanlıştı — dürüst öz

v1 mimarisi ([content-studio-pack-engine.md](./content-studio-pack-engine.md)) Bega Home'un **tek mobilya mağazası** pipeline'ından 1:1 türetildi. Deterministik `fillTemplate`, GLOBAL_PREFIX fidelity, ~0ms compose — bunların hepsi **o bağlamda** doğru ve hâlâ geçerli.

**Kırılan varsayım:** v1'in tüm determinizmi, bir insanın o dikeyde *herhangi bir* üretim yapılmadan **önce** pack'i (kategori × shot × vocabulary × TS resolver) yazmasıyla satın alınıyordu. Bu **O(dikey sayısı) insan emeği**. Ürün ise **keyfi sayıda dikeyde multi-tenant** (oyun, app, e-ticaret, restoran, klinik, B2B…). Sınırsız dikey = ödenemez maliyet.

> ▎ **Ezberci tuzağı:** sistem yalnızca birinin önceden ezberlettiği alanı biliyor. Bağlayıcı kısıt "çıktı deterministik mi?" değil — **"kimsenin pack yazmadığı bir alan için iyi talimat üretebiliyor muyum?"**. v1 bu soruya *hayır* diyor; pack dışı her alan `"other"` kovasında körleşiyor.

Dahası: pack **sektörü** yakalar, **markayı** yakalayamaz — aynı "mobile-game" pack'i sıcak indie oyuna da sert AAA'ya da aynı sesi verir. **Uyarlama sektör seviyesinde değil, MARKA seviyesinde olmalı.**

v2 pack'i **öldürmez** — kökenini değiştirir.

---

## 2. Çekirdek tez: Compile-and-Cache

Yanlış ikilem: "deterministik pack **mı**, esnek LLM **mi**". Doğru hamle: **determinizm sınırını taşımak.**

| | v1 Template Engine | Saf LLM freestyle | **v2 Compile-and-Cache** |
|---|---|---|---|
| Yeni dikey maliyeti | **O(dikey): insan pack yazar** | O(1) | **O(1): marka → pack derlenir** |
| Run-time determinizm | Byte-identical | Yok | **Byte-identical (donmuş pack)** |
| Fidelity garantisi | Mekanik prefix | LLM insafına | **Mekanik prefix (korunur)** |
| Adaptabilite | Sıfır (pack dışı = kör) | Tam ama savruk | **Tam + kontrollü** |
| Latency (hot path) | ~0ms | Her istek LLM (yüksek) | **~0ms** |
| İnsan review | Pack yazımı (her dikey) | Yok | **Derleme onayı (tenant başına, nadir)** |

**Kilit cümle:** LLM = `BrandIdentity → Pack` **derleyicisi**, her istekte oturan katılımcı değil.
- **Eski sınır:** determinizm *talimat* seviyesinde, *önceden yazarak* elde ediliyordu.
- **Yeni sınır:** determinizm *pack* seviyesinde; pack `BrandIdentity`'den tenant başına **bir kez LLM ile sentezlenir**, **insan onaylar**, **dondurulur + cache'lenir**. Derlemeden sonra o pack Bega'nınki kadar deterministik.

`begahome-furniture.pack.json` yeniden yorumlanıyor: "tenant=Bega için derleme çıktısının, bir insanın elle ince-ayar yaptığı hali" → `provenance: "human-tuned"`. Yeni tenant'lar `"llm-compiled"` pack alır. **Aynı şekil, farklı köken.**

Bu iki bilinen desene oturur:
- **CAG (Cache-Augmented Generation)** — bilgi tabanı context'e sığıyorsa retrieval yapma, **preload + KV-cache** ("Don't Do RAG", arXiv 2412.15605). Marka profili küçük + durağan → ideal CAG adayı.
- **Prompt caching** — durağan marka prefix'i cache'le (~%90 maliyet / ~%85 latency düşüşü, Anthropic).

---

## 3. Katmanlı mimari (L0–L8)

İki determinizm rejimi, iki path: **cold path** (nadir, LLM-ağır, derleme) ve **hot path** (sık, deterministik, üretim).

```
                         ┌──────────────────────────────────────────────┐
  L0  MARKA ÇEKİRDEĞİ    │  BrandIdentity (kanonik veri, tek kaynak)     │
      (bir kez kurulur)  │  voice · vocab · visual tokens · refs ·       │
                         │  positioning · audience · offering · domain* │
                         └───────────────┬──────────────────────────────┘
                                         │  (*domain = SERBEST METİN, enum DEĞİL)
        ┌────────────────────────────────┴─────────────────────────────┐
        │                                                               │
   COLD PATH (nadir, LLM-ağır)                        HOT PATH (sık, deterministik)
   ─────────────────────────────                      ─────────────────────────────
   L1  PACK DERLEYİCİ                                 L3  MEDYA ANALİZ (vision)
   BrandIdentity + intent taksonomisi                 yüklenen medya → {subject,
      → LLM (structured output + schema)                 salient attrs, sector-guess}
      → Pack JSON (categories/shots/                       │
        vocab/fidelity/caption-iskelet)                    ▼
      → Zod valide + İNSAN ONAY KAPISI              L4  ADAPTİF KOMPOZİSYON
      → DONDUR + cache (versiyonlu)                     composeInstruction(
        │                                                  pack@cached,   ← L2
        ▼                                                  visionMeta,    ← L3
   L2  CACHE / ŞABLON DEPOSU  ───────────────────────►     brandBlock,    ← L0
      compiledPack@tenant@v3                               style)
      (donmuş; marka değişince invalidate)               = fillTemplate (~0ms, byte-identical)
                                                            │
   L5  BODY-OF-WORK (RAG, opsiyonel) ──────────────────►   │ (yalnız caption/metin adımı)
      markanın kendi geçmiş içeriği                        ▼
      few-shot exemplar retrieval                    L6  FIDELITY COMPOSER (LLM-SİZ)
                                                         reference-image (IP-Adapter) +
                                                         mekanik STRICT-IDENTITY prefix
                                                            │
                                                            ▼
                                                         Gemini/edit — tek hop
                                                            │
                                                            ▼
                                                    L7  EDİTÖR (insan rötuş)
                                                         image: Filerobot · video: §9
                                                            │
                                                            ▼
                                                    L8  YAYIN (Zernio provider,
                                                         snapshot cron — mevcut)
```

| Katman | İş | Neden orada |
|--------|-----|-------------|
| **L0** Marka çekirdeği | Tek kanonik `BrandIdentity` | Küçük+durağan → CAG/prompt-cache bloğu. Her üretimde reused |
| **L1** Pack derleyici (cold) | `BrandIdentity` + dikey-bağımsız intent taksonomisi → LLM → Pack JSON | **Adaptabilitenin TEK yaşadığı yer.** Tenant başına bir kez. Restoran gelince kimse "restoran pack" yazmaz — derlenir |
| **L2** Cache deposu | Donmuş pack (versiyonlu) | Determinizm buradan sonra garanti. Bega pack'i = bu deponun `human-tuned` satırı |
| **L3** Medya analiz | Vision → pack `metadataSchema`'sını **generik** doldurur | "Bu görseldeki pazarlanabilir özne + belirgin nitelikler" her alan için yapılandırılmış metadata; furniture-özel şema yazmaya gerek yok |
| **L4** Adaptif kompozisyon (hot) | **v1 template engine'in AYNISI** — `fillTemplate` | ~0ms, byte-identical, RAG'siz, debug edilebilir. Bega garantileri burada yaşıyor. **Kod değişmez** |
| **L5** Body-of-Work (RAG) | Markanın kendi geçmiş yüksek-performanslı içeriği, few-shot | Yalnız caption/metin. Sınırsız büyür (profil büyümez) → retrieval doğru araç |
| **L6** Fidelity composer (LLM-siz) | Reference-conditioning + mekanik prefix | Ürün sadakati LLM kararı DEĞİL, mekanik kural. Alan-genel çünkü reference-conditioning kategori-agnostik |
| **L7** Editör | İnsan rötuşu (crop/aspect/text/logo/filtre; video trim/overlay) | AI çıktısı ham; yayın öncesi insan dokunuşu. OSS editör (§9) |
| **L8** Yayın | Zernio provider + snapshot cron | Mevcut altyapı ([social-publish-system]) |

---

## 4. `BrandIdentity` veri modeli (L0)

Mevcut `0012`'nin `BrandProfile`'ını + makine-tüketilebilir voice (Aaker/MindStudio) + archetype + Always/Sometimes/Never vocab + reference-conditioning ihtiyacıyla genişletir.

```ts
// L0: Kanonik marka çekirdeği. Küçük + durağan → CAG/prompt-cache bloğu.
interface BrandIdentity {
  id: string
  tenantId: string                    // §multi-tenant, RLS zorunlu
  version: number                     // marka değişince artar → compiledPack invalidate

  // ── KİMLİK & KONUMLANDIRMA (intent seçimini sürer) ──
  name: string
  tagline?: string
  // ⚠️ ENUM DEĞİL. Ezberci tuzağının şema-içi hâli tam buydu (v1: sector 5-enum).
  //    domain üzerinde KOŞULLANILIR, üzerinde DALLANILMAZ.
  domain: string                      // "artisan coffee roastery" | "pediatric dental clinic" | "B2B logistics SaaS"
  offering: string                    // "single-origin beans + subscription"
  audience: string                    // "urban professionals 25-40 who value ritual"
  positioning?: string                // "craft, not commodity"
  taxonomyTags?: string[]             // yumuşak sınıflandırma (arama/analitik) — dallanma için DEĞİL

  // ── SES/TON (spektrum, serbest sıfat değil → makine-tüketilebilir) ──
  voice: {
    formality: number                 // 0 casual … 100 formal
    energy: number                    // 0 calm … 100 punchy
    warmth: number                    // 0 distant … 100 friendly
    complexity: number                // 0 simple … 100 nuanced
    archetype?: BrandArchetype        // Hero | Sage | Rebel | Caregiver | ...
    personaSnapshot?: string          // 3-5 cümle: kural boşluğunda insan çıpası
  }

  vocabulary: {
    alwaysUse: string[]               // marka terimleri
    sometimesUse?: string[]
    neverUse: string[]                // guardrail: hard negative filter
    forbiddenClaims?: string[]        // "asla 'garantili' deme" (hukuki/etik)
  }

  // ── GÖRSEL KİMLİK (voice'un görsel analogu = design tokens) ──
  visual: {
    colors: { primary: string; secondary?: string; accent?: string; neutral?: string[] } // hex
    typography?: { primary?: string; secondary?: string; case?: "title" | "sentence" | "upper" }
    photographyStyle?: string         // "candid, natural light" vs "polished studio"
    compositionAvoid?: string[]       // "no heavy text overlay", "no busy backgrounds"
    moodKeywords?: string[]           // "warm, tactile, unhurried"
  }

  // ── REFERANS ASSET'LER (IP-Adapter conditioning = alan-genel fidelity girdisi) ──
  referenceAssets: {
    logo?: AssetRef
    productShots?: AssetRef[]         // reference-conditioning için birincil sınıf
    brandImagery?: AssetRef[]         // stil transferi referansı
  }

  // ── BODY OF WORK (RAG korpusu — profilden AYRI; sınırsız büyür) ──
  bodyOfWork?: BodyOfWorkRef[]

  // ── COMPILE ÇIKTISI (provenance + cache invalidation) ──
  compiledPack?: {
    packId: string
    packVersion: number
    sourceBrandVersion: number        // != version ise pack BAYAT → yeniden derle
    reviewedBy?: string               // insan onay kapısı
    provenance: "llm-compiled" | "human-tuned"   // Bega = "human-tuned"
  }
}

type BrandArchetype =
  | "hero" | "sage" | "explorer" | "rebel" | "magician" | "everyman"
  | "lover" | "jester" | "caregiver" | "creator" | "ruler" | "innocent"
```

**`0012`'ye karşı kritik kazanımlar:** (1) `sector` enum → `domain: string` — **en önemli değişiklik**; model dallanmıyor, koşullanıyor. (2) `voice` spektrum + archetype (makine-okunur). (3) `vocabulary` Always/Sometimes/Never + forbiddenClaims (guardrail). (4) `visual` = design tokens. (5) `referenceAssets` birinci sınıf (alan-genel fidelity). (6) `bodyOfWork` ayrı korpus (CAG≠RAG). (7) `compiledPack` provenance + cache invalidation.

---

## 5. Cold path — Pack Derleyici (L1)

Adaptabilitenin tek yaşadığı yer. Saf-LLM savrukluğunun panzehiri **structured output**:

1. **Girdi:** `BrandIdentity` + sabit, **dikey-bağımsız intent taksonomisi** — "hero", "lifestyle", "detail", "social-cover", "before/after", "testimonial", "feature-callout"… Bunlar pazarlama amaçlarıdır, sektör değil; her alana uygulanır.
2. **Sentez:** LLM (function calling + JSON schema) → pack şemasına uyan Pack JSON. Schema-uyum: structured outputs hata oranı **<%0.1**, saf JSON mode %5–10 (OpenAI). **Sıcaklık iki-hızlı:** derleme = ılımlı (domain-adaptasyonu için); run-time = donmuş (LLM yok).
3. **Doğrulama:** **Zod** ile valide → uymuyorsa retry (Guardrails/RAIL deseni).
4. **Onay kapısı:** insan review (derleme nadir olduğu için *ödenebilir*; per-request review ödenemezdi). Bega pack'inin elle ince-ayarı bu kapının kendisi.
5. **Dondur:** `compiledPack@tenant@version`, cache'le. Marka değişince (`version` artar) → invalidate → yeniden derle.
6. **Seed exemplar:** mevcut `sector-packs.ts`'in 31 el-yazımı prompt'u atılmaz — derleyiciye **few-shot örnek** olarak verilir; derleyici stili onlardan öğrenir, yeni dikeyleri kendi üretir.

---

## 6. Hot path — Adaptif Kompozisyon (L4) + Fidelity (L6)

**Hiç değişmiyor.** Mevcut `template-engine.ts` (`composeInstruction`) + `loader.ts` + `types.ts` — Faz 1'de yazdığım, `bun test` 20/20 geçen kod — aynen L4 olarak kalır. Tek fark: beslediği pack artık `data/*.pack.json` (elle) değil, `compiledPack@tenant` (derlenmiş cache).

**Fidelity (L6) alan-genel:** Reference-image conditioning (IP-Adapter) ürünün sofa mı burger mı dashboard-screenshot mu olduğunu umursamaz — "yüklediğin gerçek şeye sadık kal" **kategori-agnostik primitif**. Bega'nın furniture-özel `STRICT IDENTITY` bloğu aslında dikey-özel değil; aynı reference-conditioning + marka-ayarlı metin. *(Çıkarım: bu bir mekanizma argümanı; Flair/Booth'un iç kodu hakkında iddia değil — Booth.ai 2025'te kapandı, kavramsal örnek.)*

---

## 7. RAG vs CAG — v1 §11'i düzeltmek

v1 "RAG değil çünkü determinizm" diyordu — **sonuç doğru, gerekçe yanlış.** Doğru gerekçeler:

**RAG çekirdek compose için ZARARLI/gereksiz:** context poisoning (en zor yakalanan hata modu — akıl yürütme tutarlı görünür, arXiv SafeRAG 2501.18636), semantic noise, context rot. **Asıl neden — boyut:** marka profili küçük (yüzlerce–birkaç bin token), context'e tümüyle sığar → parçalarını retrieve etmek hepsini enjekte etmekten kesinlikle daha kötü (CAG tezi).

**RAG tam olarak İKİ yerde YARDIMCI:** (1) **Body-of-Work** — markanın kendi geçmiş kazanan içeriği, mevcut intent register'ına göre few-shot çekilir (sınırsız büyür → retrieval doğru). (2) **Uzun brand-book PDF / kampanya geçmişi** — L5 enrichment; 40-sayfa brand book her hot-path prompt'una girmemeli.

> ▎ **Baş kural:** *Preload (CAG/prompt-cache) → marka profili + design tokens. Retrieve (RAG) → body-of-work + uzun brand book.* Eşik: context'e sığıyor + tekrar kullanılıyor → **cache**. Sınırsız büyür / yalnız parça alakalı → **retrieve**.

---

## 8. Bilinen araçların deseni (alanlar-arası genelleşme)

Ortak desen: **müşteri alanı sağlar (marka + asset + feed); sistem alan-genel makineyi sağlar (conditioning + kombinatorik + feedback). Kimse dikey elle-yazmaz.** — ezbercinin panzehiri.

- **Meta Advantage+ / Google PMax:** dikey template yok; asset library + feed + marka sinyali → kombinatoryal montaj + performans-feedback seçimi. Bu ölçek (Meta: aylık 15M reklam) *ancak* per-vertical template olmadığı için mümkün.
- **AdCreative.ai:** brand-kit + kampanya-performans + conversion scoring. Farklılaştırıcı = feedback/scoring katmanı, template değil.
- **Canva Magic Studio:** Brand Kit (logo/hex/font) her üretime uygulanır — "yapılandırılmış marka = conditioning, model = genel" (ama derleme/küre adımı yok → hafif sadakat).
- **Flair.ai:** ürün-foto reference-conditioning; kategoriler-arası genelleşir çünkü reference-conditioning kategori-agnostik.

*Çıkarım:* Hedef = **Canva'nın Brand-Kit conditioning'i + AdCreative'in scoring/feedback'i + Flair'in reference-fidelity'si + Bega'nın run-time determinizmini koruyan compile-and-cache** katmanı.

---

## 9. Gömülü editör katmanı (L7) — OSS, araştırmaya dayalı

AI çıktısı ham; kullanıcı **kaydetmeden önce** rötuşlar. İki editör, farklı olgunluk.

### 9.1 Image editor — net karar

**react-filerobot-image-editor (MIT).** Tek drop-in React component, tüm ihtiyaçları out-of-the-box karşılar: crop, **aspect preset (4:5/9:16/1:1 konfigüre)**, resize, text overlay, **logo/sticker (Image/Watermark tab)**, filtre, brightness/contrast (Adjust), annotate. Data akışı tam Gemini şekli: `source`=dataURL girer, `onSave`→`imageBase64`/`imageCanvas`/blob çıkar. Aktif (v4.9.1, Dec 2024), react-konva üstünde.

**Uyarılar (blocker değil):** ~185KB gzip, tree-shake yok → `React.lazy` + dynamic `import()` ile stüdyo açılınca yüklensin (Vite otomatik code-split). styled-components runtime dep (Tailwind/@medusajs/ui ile uyumlu). Stable **v4.9.x**'te kal, 5.0 beta'ya girme.

**Bespoke alternatif:** tam @medusajs/ui uyumu istenirse **Fabric.js (MIT, v7 2026, ~90KB)** ya da **Konva** — ama crop/aspect UI'ı sen yazarsın (Filerobot bunu bedava veriyor).

### 9.2 Video editor — lisans-hassas açık karar

**Dürüst duvar:** tarayıcı-içi video editinin sınırı UI değil, **export/bellek** — ffmpeg.wasm dosya boyutunun ~2-3 katı RAM ister, mobil tavan ~512MB; WebCodecs hızlı ama Safari/Firefox eşitsiz. **Senin bağlamın (kısa klip + hafif düzenleme) tam da tarayıcının rahat bölgesi**; duvara ancak uzun/4K + mobil web'de çarparsın → ölçeklenince ağır render server'a (Lambda/ffmpeg).

> ▎ **Ticari SaaS için lisans yük-taşıyan bir karar** (multi-tenant satacaksın):

| Aday | Tür | Lisans (ticari SaaS etkisi) | Değerlendirme |
|------|-----|------------------------------|----------------|
| **OpenCut** | Tam editör UI | ✅ **MIT** — ölçekte tam ücretsiz | Ama sıfırdan yeniden yazılıyor; olgun sürüm `opencut-classic`; component gömme zahmetli |
| **designcombo/react-video-editor** | Tam editör UI | ⚠️ **>3 çalışan = Company License** | En çok özellik (trim/split/crop/overlay/timeline, WebCodecs); ama Next.js app → port gerek |
| **Remotion Player** | Motor (editör'ü sen yazarsın) | ⚠️ **4+ çalışan for-profit = ücretli** (~$100/ay min) | En temiz Vite gömme + programatik → **AI-video geleceğine en uygun**; timeline'ı sen kurarsın |
| **ffmpeg.wasm** | Export motoru | MIT wrapper (codec'e göre LGPL/GPL) | UI değil; export/merge yedeği — hangi UI olursa yanına |

**Öneri:** *design-ahead* fazında **Remotion Player + kendi hafif timeline'ı** (programatik güç, AI-video ile örtüşür) VEYA hızlı-en-çok-özellik için **designcombo fork'u**; her iki yolda **ffmpeg.wasm export yedeği**. **Uzun-vade ticari netlik istiyorsan tek tam-ücretsiz yol OpenCut (MIT)** ama olgunluk bekliyor. → **Bu bir karar noktası (§14).**

---

## 10. Mevcut arayüzü kullanışlı hale getirme

Ürün niyeti bunu zaten teşhis etmiş ([content-studio.md](../../../helm/docs/content-studio.md) §8): *"Arayüz yoğunluğu — asıl ağrı. Tek ekrana çok şey; sıkışık, kullanışsız."* v2 UI'ı adaptif akışa göre sadeleştirir:

- **Adım ⓪ — Marka:** `BrandIdentity` kurulur (bir kez). Kurulmadan üretim engellenmez ama nudge'lanır. Bu, pack-first UI'daki manuel `metadataSchema` formunun yerini alır — çünkü metadata artık markadan + vizyondan gelir, kullanıcı doldurmaz.
- **Adım ① — Görsel/Video:** yükle → analiz → **öneriler markadan derlenmiş pack'ten** (sektör chip'i değil). Kullanıcı *çıktı tipi* seçer (intent), prompt yazmaz. Deterministik önizleme → Üret → **L7 editör** → kaydet.
- **Adım ② — Metin:** caption/script; body-of-work few-shot ile marka sesinde.
- **Adım ③ — Yayın:** takvim/plan → Zernio.
- **No-scroll, iki-kolon** (§9b hedef yerleşimi): canvas + editör solda, adım paneli sağda; progressive disclosure — aynı anda 50 kontrol yok.

Faz 3'te yazdığım `PackPicker`/`ShotPreview` **çöp değil** — "intent seçici + deterministik önizleme" olarak kalır; sadece beslediği pack elle-yazılan değil, derlenmiş olur, ve manuel metadata formu markaya devredilir.

---

## 11. Determinizm & karmaşıklık

- **Hot path (L4):** `fillTemplate` — O(template uzunluğu), byte-identical. **Değişmedi** (bun test 20/20 kanıtlı).
- **Adaptabilite maliyeti:** v1'de **O(dikey sayısı)** insan emeği → v2'de **O(1)** (derleme tenant başına amortize, bir kez).
- **Cold path (L1):** derleme O(1) LLM çağrısı/tenant, nadir, cache'li. Marka değişmedikçe tekrarlanmaz.
- **CAG/prompt-cache:** durağan marka bloğu → ~%90 maliyet / ~%85 latency düşüşü (hot path'te LLM tutulursa, ör. caption cilası).

---

## 12. Mevcut koddan geçiş

| Bileşen | v2'de |
|---------|-------|
| `template-engine.ts`, `loader.ts`, `types.ts` | **Değişmez** → L4. Hot path aynı |
| `resolvers/furniture.ts`, `begahome-furniture.pack.json` | Kalır → `provenance: "human-tuned"` örneği |
| `mobile-game-ua.pack.json` | Kalır → derleyici için seed exemplar |
| `sector-packs.ts` (31 prompt) | Atılmaz → L1 derleyici few-shot seed'i |
| `POST /compose`, `GET /packs`, `edit-image` (tek-hop) | Kalır; `/packs` artık derlenmiş pack'leri listeler |
| `PackPicker`/`ShotPreview` (Faz 3) | Kalır → intent seçici; metadata formu markaya devreder |
| **YENİ: L1 Pack derleyici** | `BrandIdentity` → structured LLM → Zod → onay → cache |
| **YENİ: L7 editör** | Filerobot (image) + video (§14 kararı) |
| **YENİ: L0 `BrandIdentity`** | `0012`'yi genişlet (sector enum → domain string) |

**Task etkisi:** #0011 (pack engine) → hot-path bileşeni olarak **tamam**. #0012 (marka kimliği) → **çekirdek**e yükselir, şema §4 ile güncellenir. Yeni task'lar: **L1 derleyici**, **L7 editör entegrasyonu**, **body-of-work/RAG (sonra)**.

---

## 13. Riskler & guardrail'ler

| Risk | Önlem |
|------|-------|
| Derleyici savruk pack üretir | Structured output + Zod valide + insan onay kapısı |
| Fidelity LLM insafına kalır | L6 mekanik prefix — "ürünü koru" asla LLM kararı değil |
| Marka-dışı/yasak iddia | `neverUse` + `forbiddenClaims` hard filter + post-gen kontrol |
| Marka değişince bayat pack | `sourceBrandVersion != version` → invalidate + yeniden derle |
| Context poisoning (RAG) | Çekirdek path RAG'siz (CAG); RAG yalnız body-of-work (düşük poison riski, markanın kendi metni) |
| Video editör lisans/maliyet | §9.2 açık karar; ticari ölçekte OpenCut(MIT) vs ücretli netleştir |
| Editör bundle şişmesi | `React.lazy` + dynamic import (stüdyo açılınca yüklen) |

---

## 14. Açık kararlar (senin onayın)

1. **Video editör:** Remotion Player (programatik/AI-video, 4+ çalışanda ücretli) · designcombo fork (en çok özellik, >3 çalışan lisansı) · OpenCut (MIT, olgunlaşıyor)? Ticari SaaS lisans etkisi taşıyor.
2. **L1 derleyici LLM sağlayıcısı:** mevcut Gemini/OpenRouter mı, yoksa derleme için ayrı (daha güçlü) model mi? Derleme nadir → daha pahalı model ödenebilir.
3. **Onay kapısı:** her tenant derlemesi insan onayı mı (kalite), yoksa auto-approve + spot-check mi (ölçek)?
4. **Body-of-Work/RAG:** ilk sürümde mi, sonra mı? (Öneri: sonra — önce compile-and-cache çekirdeği.)

---

## 15. Kaynaklar

**Adaptif generation & marka-as-data:** [Google Gen-AI in PMax](https://blog.google/products/ads-commerce/get-creative-with-generative-ai-in-performance-max/) · [Meta Advantage+ 2026](https://www.admove.ai/blog/meta-advantage-creative-best-practices-for-2026) · [AdCreative.ai](https://www.adcreative.ai/) · [Canva Brand Kits](https://www.canva.com/help/create-on-brand-designs/) · [Flair.ai](https://flair.ai/) · [MindStudio: Voice Profile / Body of Work / Design Tokens](https://www.mindstudio.ai/blog/ai-brand-voice-system-voice-profile-body-of-work-design-tokens)
**Compile-and-cache & RAG:** [CAG “Don’t Do RAG” arXiv 2412.15605](https://arxiv.org/html/2412.15605v1) · [Anthropic prompt caching](https://www.anthropic.com/news/prompt-caching) · [SafeRAG arXiv 2501.18636](https://arxiv.org/pdf/2501.18636) · [Elastic: context poisoning](https://www.elastic.co/search-labs/blog/context-poisoning-llm)
**Structured output / guardrails:** [OpenAI Structured Outputs vs JSON mode](https://tianpan.co/blog/2025-10-29-structured-outputs-llm-production) · [Guardrails AI / RAIL](https://abacktools.com/blog/guardrails-ai-structured-output-validation-json-schema)
**Fidelity / reference conditioning:** [IP-Adapter](https://ip-adapter.github.io/)
**Image editor:** [react-filerobot-image-editor (MIT)](https://github.com/scaleflex/filerobot-image-editor) · [tree-shaking issue #467](https://github.com/scaleflex/filerobot-image-editor/issues/467) · [Fabric.js](https://github.com/fabricjs/fabric.js) · [Konva](https://github.com/konvajs/konva)
**Video editor:** [designcombo/react-video-editor](https://github.com/designcombo/react-video-editor) · [Remotion License](https://www.remotion.dev/docs/license) · [Remotion Player](https://www.remotion.dev/docs/player) · [OpenCut (MIT)](https://github.com/OpenCut-app/OpenCut) · [ffmpeg.wasm bellek #876](https://github.com/ffmpegwasm/ffmpeg.wasm/issues/876) · [Etro (GPL-3.0)](https://github.com/etro-js/etro)

---

*Oluşturulma: 2026-07-06 · Araştırma-dayanaklı (3 paralel ajan) · v1 pack-engine dokümanını supersede eder*
