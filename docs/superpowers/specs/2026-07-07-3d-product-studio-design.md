# 3D Ürün Stüdyosu — Tasarım (Spec)

> **Durum:** Tasarım · 2026-07-07
> **Bağlam:** İçerik stüdyosu **eksen değişikliği** — "layout template" ve "tek-adım transform" değil, **3D-merkezli üretim**. Referans: Burhan Kocabıyık'ın Claude Code build'i (fiziksel ürün → 3D → 360° döndür; Flux2→Seedance→SeeDVR üretim hattı).
> **Genişletir/düzeltir:** [content-studio-template-model.md](../../architecture/content-studio-template-model.md) (v3 — layout katmanı ⑥'ya iner) · [content-studio.md ürün niyeti](../../../../helm/docs/content-studio.md) (§4 "görselini kullan + sadık kal")

---

## 0. Tek cümle

Kullanıcının ürününü (fiziksel nesne fotoğrafı **veya** dijital ürün mockup'ı) **360° döndürülebilir bir 3D modele** çevir; bu 3D varlığı **tüm pazarlama içeriğinin — açı-tutarlı görsel, ürün videosu, sahne kompozisyonu — tek sadık kaynağı** yap.

## 1. Neden — fidelity'yi yapısal çözer

Ürün niyeti §4 çekirdek değer: **"görselini kullan + sadık kal."** begahome bunu prompt'la _yalvararak_ yapıyordu (`fidelity.global`: *"EXACT replica of the reference image... pixel-perfectly"*). Kırılgan: her üretim ürünü yeniden uydurma riski taşır.

**3D reconstruction sadakati YAPISAL kılar:** ürün artık sabit bir 3D varlık → her açı/sahne aynı gerçek üründen render edilir. Uydurma yok, prompt yalvarması yok. Bu, ürünün asıl derdinin (tutarlı, sadık, çok-çıktı pazarlama) kök çözümü.

## 2. Mimari katmanlar (uçtan uca)

```
① CAPTURE       ürün girdisi: fiziksel foto(lar) | dijital ürün asset'i
                  (esnek: tek / çoklu foto / dönen video — ürün değerine göre)
② RECONSTRUCT   image(s) → dokulu 3D mesh (GLB)            [image-to-3D motoru]
③ ASSET+VIEWER  3D varlığı sakla + 360° görüntüleyici       [react-three-fiber]
④ ANGLE/RENDER  3D'den açı seç → deterministik temel render(ler)
⑤ GENERATE      3D-beslemeli üretim:
                  • görsel : açı-render → marka-sahne (compose motoru koşullar → görsel model)
                  • video  : turntable / sahne animasyonu → ürün videosu
                  • mockup : dijital ürün → fiziksel mockup → 3D
⑥ LAYOUT+YAYIN  metin + layout (mevcut editör) → planla → paylaş
```

Her katman tek sorumluluk, iyi tanımlı arayüz; bağımsız test edilebilir.

## 3. Veri modeli (çekirdek)

```ts
interface Product3DAsset {
  id: string
  tenantId: string
  brandId?: string
  source: "physical" | "digital-mockup"
  inputs: string[]          // yüklenen foto/video URL'leri
  meshUrl?: string          // üretilen GLB
  thumbnailUrl?: string
  provider: string          // "tripo" | "meshy" | "rodin" | ...
  status: "pending" | "processing" | "ready" | "failed"
  error?: string
  createdAt: string
}
```

## 4. Motor kararı — SATIN AL vs KUR (image-to-3D)

| | SATIN AL (API) | KUR (self-host) |
|--|--|--|
| Seçenekler | Tripo · Meshy · Rodin/Hyper3D | Trellis (MS) · Hunyuan3D 2.0 (Tencent) |
| Efor | Düşük — REST çağrısı + poll | Yüksek — GPU infra + model weights + tuning |
| Maliyet | model başına ücret / abonelik | sürekli GPU sunucu |
| Kalite | olgun, tutarlı | iyi ama tuning ister |
| Risk | fiyat/limit, sağlayıcı bağımlılığı | GPU maliyeti, bakım |

▎ **Öneri: API-first (SATIN AL).** Canvas editöründe KUR doğruydu (MIT, sıfır-GPU). Ama image-to-3D **GPU-ağır bir ML işi**; ilk dilimde self-host overkill. Bir API ile 3D'yi hızlı kanıtla; hacim/gelir gelince self-host'u yeniden değerlendir. Fiyat/kalite/limit = doğrulanacak ilk task.

## 5. Mevcut işin yeri (çöp yok)

| Mevcut (bu oturum + öncesi) | Yeni mimaride |
|--|--|
| template / `SceneRenderer` / `TemplateEditor` (Faz 1/3/4) | **⑥ Layout katmanı** — üretilen görseli marka text/logo ile sarar. Atılmıyor, yeri değişiyor. |
| begahome `compose` motoru (deterministik instruction) | **⑤ görsel üretimini** açı-render'a göre koşullar (prompt beyni). |
| `generate` / `edit-image` route'ları | **⑤** görsel model çağrı altyapısı. |
| `BrandIdentity` + compiler | ⑤ sahne/kopya kişiselleştirmesi (marka-tutarlılık). |
| Zernio publish | ⑥ paylaş. |

## 6. Fazlar (working-slice-first, kredisiz-önce)

- **Faz A — 3D çekirdek.** Capture UI + image-to-3D API + asset store + 360° viewer.
  **Çıkış:** foto ver → 3D model → tarayıcıda döndür. *(API kredisi gerekir; kalan her şey kredisiz doğrulanır.)*
- **Faz B — açı → görsel.** 3D'den deterministik açı render → compose motoruyla marka-sahne görseli.
  **Çıkış:** 3D'den istenen açıda tutarlı pazarlama görseli.
- **Faz C — video.** turntable / sahne animasyonu → ürün videosu (Seedance/fal benzeri API).
- **Faz D — dijital ürün mockup → 3D.** app/oyun → fiziksel mockup → 3D varlık.
- **Faz E — layout + yayın.** mevcut editör/plan/paylaş ile birleştir; uçtan uca akış.

## 7. Açık kararlar (plan öncesi netleşecek)

1. **image-to-3D sağlayıcı** — Tripo vs Meshy vs Rodin (fiyat/kalite/limit doğrula). *[Faz A ilk task]*
2. **Video motoru** — Seedance/fal vs Runway vs Kling. *[Faz C]*
3. **mesh depolama** — S3/R2, GLB formatı, boyut sınırı.
4. **dijital-ürün mockup üretimi** (Faz D) — compose ile mockup sahnesi mi, ayrı akış mı.
5. **3D → görsel besleme** (Faz B) — açı render'ı img2img/ControlNet koşulu mu, yoksa referans mı.

---

*Oluşturuldu: 2026-07-07 · brainstorming çıktısı · sıradaki: writing-plans ile fazlı task listesi*
