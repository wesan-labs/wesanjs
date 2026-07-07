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

```
GİRDİ: 1 veya birkaç ürün fotoğrafı
  │
  ├─(2a) MULTI-VIEW ÜRETİMİ: 5° aralıkla 72 görsel  → tam 360° orbit
  │        [novel-view sentezi: SV3D / Zero123++ / Stable-Zero123]
  │
  └─(2b) GLB REKONSTRÜKSİYON: 72 view → dokulu 3D mesh (.glb)
           [InstantMesh / TripoSR / LGM — veya uçtan-uca Tripo/Meshy]

ÇIKTILAR (ikisi de birinci sınıf):
  • TURNTABLE  = 72 kare (sosyal içerik + mağaza görseli; döner ürün)
  • GLB        = mağazada gömülü interaktif 3D (<model-viewer>)
```

**Kritik sadeleştirme (uygulama notu):** GLB elde edilince, **72-kare turntable ve İSTENEN HER AÇI, GLB'den deterministik + bedava render edilir** (headless three.js). Yani:

- **Önerilen yol (BUY-first):** foto → **GLB** (Tripo/Meshy API) → GLB'yi 72 kareye (ve istenen açıya) render et. Tek ML adımı; turntable kusursuz tutarlı (gerçek mesh'ten). ④ Açı/Render **bedava** olur.
- **Alternatif (KUR):** foto → 72 view (SV3D self-host) → GLB (InstantMesh). Senin tarif ettiğin literal akış; iki ML adımı, GPU gerektirir.

Master varlık = **GLB**; turntable + açı-render'lar ondan türer.

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

## 5. Motor kararı — SATIN AL vs KUR

| | SATIN AL (API) | KUR (self-host) |
|--|--|--|
| foto→GLB | Tripo · Meshy · Rodin (uçtan-uca) | SV3D (72 view) + InstantMesh/TripoSR (mesh) |
| Efor | Düşük — REST + poll | Yüksek — GPU infra + weights + tuning |
| Maliyet | model başına ücret / abonelik | sürekli GPU |
| turntable | GLB'den bedava render (three.js) | novel-view çıktısı doğrudan |

▎ **Öneri: BUY-first (foto→GLB API) + turntable/açıları GLB'den render et.** En az ML karmaşası, kusursuz tutarlı turntable, ④ bedava. Hacim/gelir gelince SV3D+InstantMesh self-host'a bak. Fiyat/kalite/limit = Faz A ilk task.

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

## 8. Fazlar (working-slice-first)

- **Faz A — 3D çekirdek.** Yükleme UI + foto→GLB (API) + asset store + 360° viewer + **"ekran görüntüsü" ile canlı açı yakalama** + GLB'den 72-kare turntable export.
  **Çıkış:** foto ver → GLB → tarayıcıda döndür → istediğin açıyı yakala (PNG) + turntable export. *(GLB API kredisi; viewer/capture/turntable kredisiz.)*
- **Faz B — mağaza GLB embed.** Ürün sayfasına `<model-viewer>` ile interaktif 3D.
- **Faz C — açı → görsel.** GLB'den açı render → compose motoruyla marka-sahne görseli.
- **Faz D — video.** turntable/animasyon → ürün videosu (Seedance/fal benzeri API).
- **Faz E — dijital ürün mockup → 3D.** app/oyun → fiziksel mockup → GLB.
- **Faz F — layout + yayın.** mevcut editör/plan/paylaş ile birleştir; uçtan uca akış.

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
