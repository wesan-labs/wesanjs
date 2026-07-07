# 3D Ürün Stüdyosu — Tasarım (Spec) · v2

> **Durum:** Tasarım · 2026-07-07 (v2 — motor mekanizması netleşti)
> **Bağlam:** İçerik stüdyosu **eksen değişikliği** — "layout template" / "tek-adım transform" değil, **3D-merkezli üretim**. Referans: Burhan Kocabıyık'ın Claude Code build'i (fiziksel ürün → 3D → 360° döndür; Flux2→Seedance→SeeDVR üretim hattı).
> **Genişletir/düzeltir:** [content-studio-template-model.md](../../architecture/content-studio-template-model.md) (v3 — layout katmanı ⑥'ya iner) · [content-studio.md ürün niyeti](../../../../helm/docs/content-studio.md) (§4 "görselini kullan + sadık kal")

---

## 0. Tek cümle

Kullanıcının **1 (veya birkaç) ürün fotoğrafından** → **5°'lik aralıklarla 72 açılık dönüş dizisi** (tam 360°) → **GLB 3D model** üret; hem **72-kare turntable'ı** (sosyal medya + mağaza görselleri) hem **GLB'yi** (mağazada gömülü interaktif 3D) kullanılabilir kıl; ve bu 3D varlığı **tüm pazarlama üretiminin tek sadık kaynağı** yap.

## 1. Neden — fidelity'yi yapısal çözer

Ürün niyeti §4 çekirdek değer: **"görselini kullan + sadık kal."** begahome bunu prompt'la _yalvararak_ yapıyordu (`fidelity.global`: *"EXACT replica... pixel-perfectly"*) — kırılgan, her üretim ürünü yeniden uydurma riski taşır.

**3D reconstruction sadakati YAPISAL kılar:** ürün sabit bir 3D varlık → her açı/kare/sahne aynı gerçek üründen türetilir. Uydurma yok. Bu, ürünün kök derdinin (tutarlı, sadık, çok-çıktı pazarlama) çözümü.

## 2. Motor mekanizması (çekirdek — netleşti)

**KESİN PIPELINE (araştırma-doğrulanmış, 2026-07 — dostunun Flux2→Seedance→SeeDVR zinciri):**

```
GİRDİ: kullanıcı ürün fotoğrafı
  │
① FLUX.2  (image gen/edit · 4MP · Black Forest Labs)
    → HERO görsel: stüdyo/arka plan, marka rengi (hex-doğru), ürün-detayı korunur
      (multi-reference, 10 referansa kadar). Temiz, yüksek-çöz. başlangıç karesi.
  │
② SEEDANCE 2.0  (image→video · ByteDance · identity-locked)
    → 360° ORBITAL VİDEO: ürün merkezde, kamera 360° döner (~10s); "Reference Cluster"
      ile ürün kimliği KİLİTLİ (fidelity yapısal). Turntable hareketi burada üretilir.
  │
③ SeedVR  (video restorasyon/upscale)
    → orbital videoyu 4K'ya yükselt (gürültü/artefakt temizle).
  │
④ SAMPLE → 5°'de bir kare → 72 kare @5° (turntable.ts spec'i)
  │
  ├─ ÇIKTI A · TURNTABLE (72 kare): sosyal spin / mağaza galerisi / "dönen ürün".
  │            Hero görsel = kullanıcının seçtiği/yakaladığı kare.
  │
  └─⑤ RECONSTRUCT (72 kare → GLB): fotogrametri (RealityCapture/Meshroom/COLMAP)
       VEYA 3D Gaussian Splatting + mesh export → GLB
       → ÇIKTI B · GLB: mağaza interaktif 3D embed (<model-viewer>).
```

**Kanıtla (araştırma):**
- **Flux2** (BFL, Kas 2025): 4MP, multi-reference **ürün-detayı koruma**, hex marka rengi, arka plan değiştirme → hero hazırlama.
- **Seedance 2.0** (ByteDance): tek görselden **360° orbital ürün videosu**, Identity Locking / Reference Cluster ile kimlik kilidi → turntable üretimi.
- **SeedVR**: video restorasyon + hedef çözünürlüğe (**4K**) upscale.
- **72 kare → GLB**: fotogrametri veya 3DGS (mesh export); AI-üretilmiş orbital karelerde 3DGS yansıma/şeffaflıkta daha sağlam.

▎ **MİMARİ DÜZELTME (önceki Tripo yaklaşımı YANLIŞTI):** "GLB-önce, kareleri GLB'den render et" (Tripo tek-görsel→mesh) bu **kontrol edilebilir zinciri baypas ediyordu** ve ürün kimliğini yeniden-uyduruyordu. DOĞRUSU: **kareler ÜRETİLİR (Flux2→Seedance→SeeDVR), GLB kareler'den RECONSTRUCT edilir.** Kareler birincil, GLB ikincil. Tripo olsa olsa ⑤'in bir alternatifi olabilir — zincirin yerini TUTAMAZ.

## 3. Mimari katmanlar (uçtan uca)

```
① CAPTURE       ürün girdisi: fiziksel foto(lar) | dijital ürün asset'i
② RECONSTRUCT   foto → GLB (+ 72-kare turntable)                [§2 motoru]
③ ASSET+VIEWER  GLB sakla + 360° viewer (react-three-fiber) + mağaza embed (<model-viewer>)
④ CAPTURE/RENDER GLB'yi canlı döndür + "ekran görüntüsü" → o açının PNG'si (hero görsel);
                  + 72-kare turntable export (dönen video/sosyal) — ikisi de bedava, three.js
⑤ GENERATE      3D-beslemeli üretim:
                  • görsel : açı-render → marka-sahne (compose motoru koşullar → görsel model)
                  • video  : turntable / sahne animasyonu → ürün videosu
                  • mockup : dijital ürün → fiziksel mockup → 3D
⑥ LAYOUT+YAYIN  metin + layout (mevcut editör) → planla → paylaş
```

## 4. Veri modeli (çekirdek)

```ts
interface Product3DAsset {
  id: string
  tenantId: string
  brandId?: string
  source: "physical" | "digital-mockup"
  inputs: string[]          // yüklenen foto/video URL'leri
  meshUrl?: string          // master varlık: GLB
  turntableUrls?: string[]  // 72 kare @ 5° (GLB'den render veya novel-view çıktısı)
  thumbnailUrl?: string
  provider: string          // "tripo" | "meshy" | "sv3d+instantmesh" | ...
  status: "pending" | "processing" | "ready" | "failed"
  error?: string
  createdAt: string
}
```

## 5. Motor kararı — pipeline API'leri (SATIN AL)

Zincir 4 model adımı. **fal.ai YASAK** — aggregator kullanılmayacak. ① host'u doğrulandı (BFL doğrudan); ②③ host'u açık.

| Adım | Model | API host |
|--|--|--|
| ① hero | FLUX.2 [pro] | **BFL doğrudan** (`api.bfl.ai`) — DOĞRULANDI |
| ② orbital video | Seedance 2.0 | AÇIK (fal yasak → Volcengine/ByteDance/Replicate?) |
| ③ 4K upscale | SeedVR | AÇIK (fal yasak → WaveSpeed/Replicate?) |
| ⑤ kare→GLB | fotogrametri (RealityCapture/Meshroom) VEYA 3DGS (mesh export) | self-host / servis |

▎ **HOST KARARI: BFL doğrudan API (fal.ai YASAK).** ① Flux2 birinci-taraf kaynağından çağrılır. **Doğrulanmış sözleşme (docs.bfl.ml · 2026-07-08):**
- Base `https://api.bfl.ai` (bölgesel: `api.eu.bfl.ai` · `api.us.bfl.ai`) · auth header `x-key`.
- `POST /v1/flux-2-pro` (default; alt: `-flex` tipografi/detay, `-max`, `-klein-4b/9b`). Gövde: `prompt` (zorunlu) · `input_image`…`input_image_8` (**8 referansa kadar**, dizi değil düz alanlar) · `seed` · `width`/`height` (≥64) · `safety_tolerance` 0–5 · `output_format` jpeg|png|webp.
- Yanıt: `{ id, polling_url }`. GET `polling_url` (`x-key`) → `status`: Pending|Ready|Error; hazırsa `result.sample` = görsel URL.
- ⚠️ Üretilen URL **10 dk'da expire** → indir + kendi altyapından yeniden servis et.

▎ **Uydurma düzeltmeleri (iptal edilen fal taslağından):** (a) referans üst sınırı **8**, 10 değil (`capRefs(10)` yanlıştı). (b) **hex marka rengi API alanı YOK** — renk PROMPT metnine yazılır, alan değil. (c) girdi görselleri `input_image_N` düz alanları, `image_urls` dizisi değil.

▎ **② Seedance / ③ SeeDVR host'u AÇIK karar.** fal yasak; BFL yalnız görsel üretir, video yapmaz. Kapsam netleşmeli: **sadece Flux2 mı** (turntable'ı başka yolla mı), yoksa video zinciri için ayrı host mu (Replicate/Volcengine/doğrudan ByteDance)? Doğrulanmadan kod yok.

▎ **Tripo notu:** tek-görsel→mesh; bu **kontrollü zinciri baypas eder**, ürün kimliğini yeniden-uydurur → çekirdek motor DEĞİL. Olsa olsa ⑤ için bir alternatif. (Faz A'da yanlışlıkla çekirdek yapılmıştı — düzeltiliyor.)

## 6. Kullanım yüzeyleri

- **Sosyal içerik:** 72-kare turntable → döner ürün reel/post; veya seçili açı → marka-sahne görseli.
- **Mağaza görseli:** turntable kareleri ürün galerisinde.
- **Mağaza 3D embed:** GLB → ürün sayfasında `<model-viewer>` ile interaktif 3D (müşteri döndürür).
- **Video:** turntable/animasyon → ürün videosu.
- **Görsel üretim:** herhangi bir açı render → compose motoruyla marka-sahne (arka plan, ışık, kompozisyon).

## 7. Mevcut işin yeri (çöp yok)

| Mevcut | Yeni mimaride |
|--|--|
| template / `SceneRenderer` / `TemplateEditor` (Faz 1/3/4) | **⑥ Layout** — üretilen görseli/turntable'ı marka text/logo ile sarar. |
| begahome `compose` motoru | **⑤ görsel üretimini** açı-render'a göre koşullar (prompt beyni). |
| `generate` / `edit-image` route'ları | **⑤** görsel model çağrı altyapısı. |
| `BrandIdentity` + compiler | ⑤ marka-tutarlı sahne/kopya. |
| Zernio publish | ⑥ paylaş. |

## 8. Fazlar (working-slice-first · DÜZELTİLDİ)

- **Faz A — üretim hattı (turntable).** Yükleme UI + **Flux2→Seedance→SeeDVR pipeline** (fal/replicate) → 72-kare 4K orbital turntable + asset store + **kare-seçici viewer** (hero kareyi seç/yakala).
  **Çıkış:** foto ver → 360° orbital turntable → istediğin kareyi seç (hero görsel). *(Pipeline kredi-gated; turntable görüntüleme/seçim kredisiz.)*

  **Somut dilimler (build-yeşil sırası — Tripo yolu retire edilene kadar yanında yaşar):**
  - [x] **A1 · pipeline saf çekirdek** — `lib/three-d/pipeline.ts`: `nextStep` state-machine (hero→orbital→upscale→sample→done) + `sampleTimestamps` (④ video→kare) + `PipelineModelStep`/`StepInput`/`StepJob`/`StepResult` sözleşmeleri. Key gerektirmez, unit-test'li. *(2026-07-08)*
  - [ ] **A2 · adaptörler** — `providers/flux.ts` · `seedance.ts` · `seedvr.ts`: her biri `PipelineModelStep` (submit+poll). Tek host-client (fal/replicate) arkasında; `HOST_API_KEY` env. `tripo.ts` → ⑤ alternatifi olarak Faz B'ye taşınır.
  - [ ] **A3 · veri modeli** — `product-3d-asset` model: `mesh_url`-merkezli → `pipeline_step` + `step_job_id` + `hero_url` + `video_url` + `turntable_urls[]`. Yeni migration.
  - [ ] **A4 · zincir workflow** — `create/poll` (tek-görev Tripo) → **poll-on-read state-machine**: her poll aktif adımın job'ını sorar; hazırsa bir SONRAKİ adımı submit eder + `pipeline_step` ilerletir. `sample` adımında SeeDVR mp4'ünü `sampleTimestamps`'te kare-çıkar → `turntable_urls`. Terminal: `done`.
  - [ ] **A5 · UI** — `three-d-demo.tsx`: GLB→capture akışı (ters mimari) çıkar; foto→pipeline durum takibi + 72-kare şeridi + hero kare seçici.

  ▎ **A4 kararı (async orkestrasyon):** 3 ardışık uzun-job'ı tek workflow'da bloklamak yerine, Tripo'daki **poll-on-read** deseni korunur ama artık ADIMLI: varlık hangi adımda olduğunu (`pipeline_step` + `step_job_id`) taşır; `GET /:id` aktif adımı poll eder, biterse sonrakini tetikler. Job altyapısı gerektirmez.
- **Faz B — GLB + mağaza embed.** 72 kare → GLB reconstruct (fotogrametri/3DGS) → `<model-viewer>` ile mağaza interaktif 3D.
- **Faz C — açı/kare → marka görseli.** seçili kare/açı → compose motoruyla marka-sahne görseli.
- **Faz D — video.** orbital/sahne animasyonu → ürün videosu (zaten Seedance hattında).
- **Faz E — dijital ürün mockup → hat.** app/oyun → fiziksel mockup → pipeline.
- **Faz F — layout + yayın.** mevcut editör/plan/paylaş ile birleştir; uçtan uca akış.

▎ **Faz A yürütme düzeltmesi (2026-07-07):** Faz A ilk turda Tripo (foto→GLB) ile yazıldı — **yanlış motor** (zinciri baypas ediyordu). Kurtarılan: `ThreeDProvider` soyutlaması (pipeline'a evrilir), `turntable.ts` (72×5° = pipeline kare spec'i), `product-3d` modül/store/route (motor-agnostik), `model-viewer` (Faz B GLB için). Değişen: `tripo.ts` → Flux2→Seedance→SeeDVR pipeline adımları.

## 9. Açık kararlar

1. **foto→GLB sağlayıcı** — Tripo vs Meshy vs Rodin (fiyat/kalite/limit doğrula). *[Faz A ilk task]*
2. **mesh depolama** — S3/R2, GLB boyut sınırı, turntable kare formatı (webp).
3. **turntable kaynağı** — GLB'den render (önerilen) vs novel-view çıktısı.
3b. **viewer/capture bileşeni** — `<model-viewer>` (hazır orbit + `toBlob()` capture + mağaza embed, en basit) vs react-three-fiber (özel ışık/arka plan, `preserveDrawingBuffer` + `toDataURL`). Öneri: model-viewer ile başla.
4. **video motoru** — Seedance/fal vs Runway vs Kling. *[Faz D]*
5. **dijital-ürün mockup** (Faz E) — compose ile mockup sahnesi mi, ayrı akış mı.
6. **3D → görsel besleme** (Faz C) — açı render'ı img2img/ControlNet koşulu mu, referans mı.

---

*Oluşturuldu: 2026-07-07 · brainstorming çıktısı · v2: motor = foto→(72 view @5°)→GLB, turntable+GLB birinci sınıf çıktı · sıradaki: writing-plans ile fazlı task listesi*
