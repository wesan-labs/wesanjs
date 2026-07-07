# Content Studio — Template Modeli (Mimari v3, redesign)

> **Durum:** Tasarım (2026-07-07) · **Bağlam:** UX redesign (flow-clarity + coherence ağrıları) + ürün modeli netleşmesi (Canva-tarzı marka-template)
> **Genişletir:** [content-studio-adaptive-engine.md](./content-studio-adaptive-engine.md) (v2 — compile-and-cache motoru burada **kişiselleştirme beyni** olarak yaşar) · [#0013 north-star](../tasks/0013-content-studio-ship-goal.md)
> **Araştırma:** foto template motoru + video template motoru (lisans-doğrulanmış, §7 kaynaklar)

---

## 0. Tek cümle

Kullanıcı markasını **bir kez** kurar (AI-destekli); sistem markaya göre **hazır tasarım template'leri önerir**; **AI template'i markaya doldurur** (renk/logo/font/kopya + gereken görseli üretir); kullanıcı isterse **editörde tweak eder**; paylaşır. Template = kullanıcının gördüğü birim; v2 compile-and-cache motoru = template'in AI-slot'unu besleyen beyin.

## 1. Neden — iki UX ağrısını çözer

Kullanıcı iki ağrı seçti: **(a) akış gizli / ne yapacağım belli değil**, **(b) parçalar dağınık**. Template modeli ikisini birden vurur:
- **Akış görünür:** somut bir **template galerisi** başlangıç noktası (boş ekran değil); her template bir "sonuç önizlemesi". Ne üreteceğin gözünün önünde.
- **Parçalar birleşir:** marka → template → AI-doldur → editör → paylaş **tek bağlı iplik**. Editör ayrı bir ada değil, template'in düzenlenebilir hâli.

Yoğunluk/tık-sayısı kullanıcının ana derdi DEĞİLdi → "kontrol azalt" değil "yönlendir + birleştir" hedefi.

## 2. Template = veri modeli

Bir template artık "prompt" değil — **tipli slot'lu JSON sahne** (foto ve video için ortak kavram, farklı motor):

```ts
interface Template {
  id: string
  kind: "image" | "video"
  format: string          // "ig-post-1x1" | "ig-story-9x16" | "reel-9x16" | "og-16x9"...
  domainTags?: string[]   // öneri için (yumuşak; dallanma değil)
  scene: SceneJSON        // motor-native sahne (react-konva JSON | Remotion props-şeması)
  slots: Slot[]           // markaya bağlanan tipli slot'lar
  thumbnail: string
}

type Slot =
  | { id: string; type: "text";  bind: "headline" | "body" | "cta" | "custom"; maxLen?: number }
  | { id: string; type: "color"; bind: "primary" | "secondary" | "accent" }
  | { id: string; type: "font";  bind: "primary" | "secondary" }
  | { id: string; type: "logo" }
  | { id: string; type: "image"; source: "user-media" | "ai-generate" }  // ai-generate → v2 compose
```

**Kişiselleştirme (AI'ın daralmış rolü — kullanıcının dediği gibi):** layout SABİT; AI sıfırdan tasarlamaz, sadece slot'ları **doldurur**:
- `color`/`font`/`logo` → **deterministik** (marka token'ları doğrudan).
- `text` → **LLM** (marka sesiyle kopya; v2'nin `voice`/`vocabulary`).
- `image` (source=ai-generate) → **v2 compose motorum** (marka → derlenmiş instruction → Gemini). source=user-media → kullanıcının yüklediği.

Sonuç = **editörde tümüyle düzenlenebilir sahne** (kullanıcı isterse her elemanı değiştirir).

## 3. Motor kararı — SATIN AL vs KUR (senin çatalın)

Foto + video **aynı stratejik çatala** iniyor:

| | SATIN AL (time-to-market) | KUR (sahiplik/IP) |
|---|---|---|
| **Foto** | **Polotno** — modelinin birebir karşılığı (`{variable}` fill + JSON + export), shipped. ⚠️ ~**$899/ay** (tek domain/brand-family) veya $249/ay Grass Roots. | **react-konva@18** (MIT) — Polotno'yla **aynı motor**; slot+`{var}`-fill+editör katmanını sen yazarsın. |
| **Video** | **Remotion** — template=props birebir, React-Player native, olgun. ⚠️ **Automators**: $0.01/render + **min $100/ay** + AWS/GCP render compute. | **Revideo** (MIT) — props-render modeli var, self-host sınırsız. ⚠️ bakım riski (ekip Midrender'a kaydı), imperative model. |
| Efor | Düşük (haftalar) | Yüksek (aylar) |
| **Tekrarlayan maliyet** | **~$1000+/ay** | **~$0** (yalnız render compute) |
| Sahiplik | Lock-in | Tam senin IP'n |
| Risk | Fiyat artışı, uç-kullanıcı-türev lisans maddesi | Efor, Revideo bakım |

**Kritik:** Polotno **react-konva üstünde** kurulu → SATIN AL ile KUR *aynı zemini* paylaşır (DIY ters-akıntı değil). Ve **react-konva@18'i az önce pinledim** (Filerobot fix'i) → KUR yolu buna hazır.

▎ **KARAR (2026-07-07): KUR — react-konva@18 (foto), video sonra (Revideo).** Gerekçe: pre-revenue + design-ahead + own-IP hedefi → ~$1000/ay tekrarlayan gider mantıksız; efor = öğrenme/hazırlık; çekirdek editör kendi IP'n; react-konva zaten pinli. Polotno/Remotion (SATIN AL) yalnız fonlu+gelire-koşan senaryoda doğruydu.

**Filerobot?** Foto-rötuş editörüydü, template motoru değil. react-konva KUR seçilirse Filerobot ya kalkar ya "ham fotoğrafı rötuşla" için ikincil kalır. (Şu an react-konva@18 pinli, çalışıyor.)

## 4. Marka kurulumu (AI-destekli — senin istediğin)

Kullanıcı **bir prompt/açıklama** verir ("markam artisan kahve kavurucusu, sıcak/samimi ton, terracotta+krem, hedef kitle ritüel-seven şehirliler") → **AI marka bilgilerini çıkarır** → `BrandIdentity` (v2 §4) doldurulur, kaydedilir. Gizliden = kullanıcı form doldurmaz, konuşur. Elle düzeltme opsiyonel. Bu, v2 compile-and-cache'in girdisi; marka bir kez, donar.

## 5. Template kütüphanesi — nereden gelir?

Açık soru (§8), ama seçenekler: (a) **kürlenmiş çekirdek kütüphane** (biz birkaç güçlü format×stil template'i yazarız — head), (b) **AI layout üretimi** (sonra — riskli), (c) topluluk/import. **Öneri:** başta küçük kürlenmiş set (format başına 3-5 template), marka-fill'i onlarda kanıtla; genişleme sonra.

## 6. UI redesign — yolculuk (v2 §10 + template)

```
Adım ⓪  MARKA (bir kez, AI-destekli prompt)   ← nudge, kurulmadan da geçilir
Adım ①  TEMPLATE GALERİSİ (markaya-önerili, foto+video, format sekmeleri)
           → template seç
Adım ②  AI-DOLDUR (deterministik token + LLM kopya + compose görsel) → önizleme
Adım ③  EDİTÖR (isteğe bağlı tweak — react-konva sahne)
Adım ④  METİN (caption, marka sesi)
Adım ⑤  PLANLA → PAYLAŞ (Zernio, mevcut)
```
Üstte **hep-görünür yolculuk şeridi** (neredeyim + adımlar), canvas merkez, her adım bağlı — "akış gizli + dağınık" çözülür.

## 7. Mevcut işin nereye oturuyor (çöp yok)

| Mevcut | v3'te |
|--------|-------|
| v2 compile-and-cache motoru (29/29 test) | **Kişiselleştirme beyni** — template'in `ai-generate` görsel-slotunu + kopyasını markaya göre üretir |
| `BrandIdentity` + derleyici | Marka kurulumunun (Adım ⓪) çekirdeği |
| PackPicker/ShotPreview | **Template galerisine** evrilir (pack/shot → template/format) |
| react-konva@18 pin | **KUR yolunun** temeli — DIY editör motoru |
| Filerobot | İkincil "ham rötuş" veya kalkar |
| Zernio publish + snapshot | Paylaş adımı (değişmez) |

## 8. Açık kararlar

1. ✅ ~~**SATIN AL vs KUR**~~ → **KARAR VERİLDİ: KUR (react-konva@18)** (§3).
2. **Fazlama:** foto template'leri ÖNCE (react-konva), video SONRA (Remotion vs Revideo o zaman)? (Öneri: evet — foto ile modeli kanıtla.)
3. **Template kütüphanesi:** küçük kürlenmiş setle mi başlayalım (öneri) yoksa AI-layout mı?
4. **Marka kurulumu AI-prompt:** ilk sürümde mi, sonra mı? (Öneri: capture MVP + AI-assist sonra, v2 #0012 hybrid.)

## 9. Fazlar (KUR + foto-önce varsayımıyla — onaya bağlı)

```
Faz 1  Template veri modeli + react-konva sahne render (slot şeması, JSON load/save)
Faz 2  Marka-fill: deterministik token + LLM kopya + v2 compose görsel-slot → doldurulmuş sahne
Faz 3  Editör: react-konva üstünde tweak (metin/renk/font/logo/görsel değiştir) + export
Faz 4  Küçük kürlenmiş template kütüphanesi (3-5 format × birkaç stil) + galeri UI
Faz 5  UI redesign yolculuk şeridi (Adım ⓪-⑤ bağlı akış)
Faz 6  Video template (Remotion/Revideo kararı) — foto kanıtlandıktan sonra
```
Her faz kendi çalışan dilimi; kredisiz doğrulanabilenler (sahne render, token-fill, editör) önce.

---

*Oluşturuldu: 2026-07-07 · Araştırma-dayanaklı (foto+video template motoru, lisans-doğrulanmış) · v2'yi genişletir (motor = kişiselleştirme beyni)*
