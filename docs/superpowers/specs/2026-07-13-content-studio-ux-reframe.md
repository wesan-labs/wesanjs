# İçerik Stüdyosu — UX Reframe + Verimli Yeniden Kurgu (Spec)

> **Durum:** Tasarım · 2026-07-13
> **Amaç:** Çalışan medya zincirini BOZMADAN, arayüzü ürün-sahibi (esnaf) için "gir→taslak→gözden geçir→gönder" outcome-akışına çevirmek; pipeline'ı gizlemek; klasör yapısını sadeleştirmek.
> **Genişletir:** [2026-07-07-3d-product-studio-design.md](./2026-07-07-3d-product-studio-design.md) (§5b pipeline=veri, §5c 4-adım akış).
> **Bağlam:** Multi-tenant SaaS'ın satılabilir, kredi-gated **eklentisi**. Müşteri (tenant) = platformda fiziksel ürün satan işletme; kullanıcı = içeriği üreten kişi.

---

## 0. Tek cümle
Ürün sahibi telefon fotoğrafını atar → AI tek geçişte satılabilir taslak (temiz görsel + açıklama + caption, opsiyonel 3D) üretir → kullanıcı gözden geçirir → mağazaya ekler + sosyalde paylaşır. Teknik hat arkada, gizli.

## 1. ÇALIŞAN ZİNCİR — BOZULMAYACAK envanter (2026-07-13 kod-durumu)

**Medya = tek Gemini/Google key** (`GEMINI_API_KEY`, helm/.env):
- Metin/analiz: `gemini-2.5-flash` · Görsel: `gemini-2.5-flash-image` (Nano Banana) — `lib/ai/content-generator.ts`, CANLI.
- 360° video: **Veo 3.1** (`veo-3.1-generate-preview`, predictLongRunning→poll→`response.generateVideoResponse.generatedSamples[0].video.uri`) — CANLI-DOĞRULANDI (~$0.25, 4K dahili). Ürün-tutarlılığında en iyi. `scripts/smoke-veo.ts`.
- Eski BFL/Seedance/SeeDVR/Runware adaptörleri repo'da (pipeline=data ile swap'lanabilir) ama DEFAULT değil.

**GLB (girdiye göre iki yol — §5c):**
- **Gerçek çoklu-açı foto → LOKAL reconstruction** (bedava, vendor'sız, entegre): `foto → ffmpeg → pycolmap SfM → rembg silüet → visual-hull → GLB`. **KANITLANDI** (`/tmp/recon/`: SfM 80/80 kamera, GLB üretti). ⚠️ visual-hull KABA — kalite için dense/3DGS (GPU) gerekir.
- **AI-video'dan reconstruction BAŞARISIZ** (kamera yolu gerçek orbit değil, 141° boşluk). Reconstruction ancak GERÇEK fotoğraflarla.
- **Tek foto / AI çıktısı → AI-3D** (Rodin/Tripo, `smoke-rodin.ts`) opsiyonel-premium, kredi-gated.

**İş çıktısı + altyapı (CANLI):** "Ürün olarak ekle" (`POST /admin/content/3d/product`, `createProductsWorkflow`, güvenlik-fix'li) · re-host (`rehost.ts`, SSRF-korumalı) · ürün-bazlı kütüphane (`product_ref`) · çoklu-foto upload (ana tuval + 3D panel) · R2/S3 env-gated (`medusa-config.js`). fal.ai YASAK.

**Bu envanterin hiçbiri silinmez.** Reframe = üstüne yeni sunum katmanı + hattı gizleme.

## 2. Kullanıcı akıl yürütmesi (kısa — tam analiz konuşmada)
- **Persona değil İŞ:** aynı esnaf farklı anda 3 iş yapar — listeleme / içerik / farklılaşma. İlk soru "ne yapmak istiyorsun" olmalı; sırayı kullanıcının işi belirler, biz dayatmayız.
- **Başlangıç hali:** elinde kötü telefon fotoğrafı; kafasında "profesyonel görünsün" (bizim "hero/turntable" kelimelerimiz DEĞİL); korkusu karmaşa + kredi yakmak.
- **Teşhis:** mevcut stepper (Görsel→3D→Metin→Yayın) bizim PIPELINE'ımızı yansıtıyor, kullanıcının YOLCULUĞUNU değil. Kanıt: 3D adım-2'de (çoğu kullanmaz), Görsel+Metin ayrı (oysa tek geçişte üretilebilir).

## 3. UX REFRAME — outcome akışı + iki katman

### 3.1 Varsayılan akış (esnaf-birincil)
```
① NİYET      "ne yapıyorsun" (listeleme / sosyal / 3D) — ya da atla, akıllı varsayılan
② GİRDİ      ürün fotoğraflarını at (çoklu) + (ops.) ürün adı. "ne satıyorsun" auto-algı (Gemini)
③ TASLAK     AI TEK GEÇİŞTE: temiz görsel(ler) + açıklama + caption. İlerleme KULLANICI DİLİNDE.
             3D burada TEKLİF: "360° dönen hali de? (ekstra kredi)"
④ GÖZDEN GEÇİR  bitmiş ÜRÜN KARTI (görsel+metin bir arada). Her parça basit "yeniden üret".
⑤ GÖNDER     2 net hedef: [Mağazana ekle] · [Sosyalde paylaş]
```
İlke: "adımlar" = bizim üretim aşamalarımız (arkada). Kullanıcının gördüğü = **bir kez gir, neredeyse-bitmiş sonucu onayla.**

### 3.2 İki katman (persona çatışması çözümü)
- **Varsayılan = outcome akışı** (esnaf, sıfır-teknik, sihir-butonu).
- **"Gelişmiş" = katlanır araç-kutusu** (pazarlamacı/ajans): bugünkü panelli stepper'lı hali — tek tek görsel düzenle, şablon, batch, sağlayıcı/param.
- Aynı motor, iki sunum. **Basit olan ASLA teknik sızdırmaz** (bugünkü "runware · RUNWARE_API_KEY eksik" kartları varsayılandan GİDER, Gelişmiş'e iner).

### 3.3 Dil ve craft (impeccable product-register)
- Kullanıcının kelimeleri: "ürününü mağazaya hazırla", "profesyonel görsel" — "hero/orbital/reconstruct" ASLA görünmez.
- İlerleme: "temiz görsel hazırlanıyor…" değil "Flux2 processing".
- Kredi şeffaf ama kaygısız; buton=fiil+nesne; her adım "sıradaki"ni iter.
- Kontrast ≥4.5:1 (muted-gri gövde metinleri düzelt), kart-içinde-kart yok, yuvarlama 12–16px.

## 4. Mimari ilkeler (değişmeyen)
- **pipeline=data** (§5b): op-kayıt + descriptor + registry. Sağlayıcı/adım swap = tek satır.
- **Gemini-merkez medya:** metin+görsel+video tek client.
- **Reconstruction = entegre WORKER** (server-side job): pipeline job atar → worker (ffmpeg→COLMAP→dense→GLB) → GLB döner. Şu an lokal script; SaaS'ta GPU box/servis.
- **Kredi-gated** her AI adımı; metering descriptor'dan (op-bazlı sayaç).

## 5. KLASÖR YAPISI (mevcut → hedef; minimal reorg, YAGNI)

### Backend (`packages/plugins/content/src/`)
```
lib/media/                    # HEDEF: tüm AI medya Gemini-merkez (content-generator.ts buraya bölünür)
  gemini.ts                   #   tek client (generateContent + predictLongRunning)
  text.ts  image.ts  video.ts #   ince sarmalayıcı (video.ts = Veo)
lib/three-d/
  pipeline-def.ts step-registry.ts  # data-driven (default: reconstruction; opsiyonel: rodin/runware)
  providers/{rodin,runware}.ts      # AI-3D opsiyonel-premium
  reconstruction/
    contract.ts               # job tipleri (girdi foto[]/video, çıktı GLB)
    (Python hattı AYRI → infra/reconstruction/ ; plugin sadece job atar)
  rehost.ts
modules/product-3d/           # asset modeli (mesh_url, pipeline_step, product_ref…)
workflows/product-3d/         # create/poll state-machine
api/admin/content/{studio,3d,product,generate,...}/route.ts
scripts/                      # smoke-veo, smoke-rodin, recon (dev)
```
> Eski çoklu-vendor adaptörleri (`bfl,byteplus,wavespeed`) `providers/legacy/`'e taşınır — silinmez, default değil.

### Frontend (`packages/admin/dashboard/src/routes/content/`)
```
studio/                       # HEDEF: VARSAYILAN outcome-akış (yeni)
  index.tsx                   #   ① niyet → ⑤ gönder orkestrasyonu
  steps/{intent,input,draft,review,ship}.tsx
advanced/                     # GELİŞMİŞ mod (bugünkü index.tsx buraya taşınır)
  index.tsx
  panels/{image,three-d,text,publish}.tsx   # bugünkü *-tab.tsx'ler
components/                   # paylaşılan: upload, coverage, product-card, credit-badge
hooks/api/content.tsx
```
> Route: `/content` = studio (varsayılan). `/content/advanced` = gelişmiş. Bugünkü `index.tsx` içeriği advanced'e taşınır, studio yeni yazılır ama **aynı hook/API'leri** kullanır.

### Reconstruction worker (infra — ayrı)
```
infra/reconstruction/         # HEDEF: entegre worker (GPU'lu SaaS servisi)
  pipeline.py                 # ffmpeg → COLMAP(pycolmap) → dense/3DGS → mesh → GLB
  Dockerfile  requirements.txt
  (şu an: /tmp/recon/ lokal PoC — buradan taşınacak)
```

## 6. İŞ PLANI (fazlı — çalışan zinciri bozmadan)

**Faz U0 — Güvenli taban (reorg, davranış değişmez).**
- [ ] `advanced/`: bugünkü `index.tsx` + `*-tab.tsx` panelleri oraya taşı, route `/content/advanced`. Davranış AYNI. (Regresyon riski min; sadece taşıma.)
- [ ] `lib/media/`: `content-generator.ts`'i gemini/text/image/video'a böl (import'lar korunur).
- [ ] 3D descriptor default'unu netle: reconstruction (lokal) — runware kartı Gelişmiş'e.

**Faz U1 — Outcome studio iskeleti (yeni, varsayılan).**
- [ ] `studio/index.tsx` + `steps/`: ② girdi (çoklu foto — mevcut upload'ı kullan) → ③ taslak (Gemini tek-geçiş: image+text) → ④ gözden geçir (ürün kartı) → ⑤ gönder (mevcut "ürün ekle" + publish). ① niyet başta atlanabilir (akıllı varsayılan).
- [ ] Teknik dil temizliği: ilerleme kullanıcı-dilinde; sağlayıcı/model/env görünmez.

**Faz U2 — 3D teklifi + kapsama (outcome içinde).**
- [ ] ③'te "360°/3D ekle" opsiyonel teklif. Çoklu-açı → reconstruction; kapsama göstergesi (mevcut) burada.
- [ ] Reconstruction worker'ı entegre et (infra/reconstruction, job+poll). Önce GERÇEK fotoğraflarla kalite doğrula.

**Faz U3 — Gelişmiş katman + parite.**
- [ ] "Gelişmiş" geçişi (studio ↔ advanced). Pazarlamacı için kontrol/şablon/batch.
- [ ] Kredi şeffaflığı, marka katmanı (opsiyonel).

**Faz U4 — Craft/polish (impeccable).** kontrast, hiyerarşi, motion, boş-durum, responsive.

## 7. Açık kararlar
1. **① Niyet ekranı** başta mı, yoksa akıllı-varsayılanla atlanıp sonra mı sorulsun? (Sürtünme vs netlik.)
2. **Reconstruction kalite hedefi:** visual-hull yeter mi (kaba) yoksa dense/3DGS (GPU box) şart mı — gerçek-foto testi karar verir.
3. **GPU box:** self-host (Runpod/Modal, senin kontrol) vs yok (sadece AI-3D Rodin premium). Maliyet+kalite dengesi.
4. **Batch** (dropshipper ②/pazarlamacı ③): studio'da mı, sadece advanced'te mi.
5. **Reorg zamanlaması:** U0 taşımayı şimdi mi yapalım (temiz taban) yoksa studio'yu bugünkü yapının üstüne mi kuralım (daha az risk, daha kirli).

---

*Kaynak akıl yürütme: bu oturum (jobs-to-be-done, mental model, pipeline≠yolculuk teşhisi). Envanter: [[content-studio-3d-pivot]] memory. Fiyat: [[3d-studio-pricing]].*
