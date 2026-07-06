# 0012 — Marka Kimliği (Brand Identity) · Adım ⓪

| | |
|---|---|
| **Durum** | 📋 Backlog (tasarım onaylı, implementasyon bekliyor) |
| **Öncelik** | Yüksek (Adım ①-③'ü besler) |
| **Kapsam** | **Faz 1 — Capture MVP.** AI-assist (Faz 2) ve tenant DB (Faz 3) bilinçli ertelendi. |
| **Etiket** | content-studio · brand · profile · adım-0 |
| **Mimari referans** | [content-studio-pack-engine.md](../architecture/content-studio-pack-engine.md) §4.2 (L2 brand profile) · §5.4 (çoklu tenant) |
| **Ürün niyeti** | [content-studio.md](../../../helm/docs/content-studio.md) §5, §6 ("sektöre + markaya göre") |
| **İlgili** | #0011 Pack Engine (`brand_profile`'ı L2 metadata olarak okur — gevşek bağlı) · #0004/#0005 tenant/RLS (Faz 3) |

## Amaç

Kullanıcı markasını **bir kez** kurar → `brand_profile` üretir → İçerik Stüdyosu pipeline'ının **her adımını** (görsel · metin · yayın) besler. Ürün niyetinin "sektöre + markaya göre" ve "seç, yazma" ilkelerinin **girdi katmanı** budur.

**Yaklaşım — hybrid, kademeli:**

- **Faz 1 (MVP):** Capture — kullanıcı marka gerçeklerini girer (ad, renk, logo, ses/ton, sektör). AI üretmez, toplar+saklar.
- **Faz 2 (sonra):** AI-assist — logodan palet çıkar, sektörden ton öner, brief'ten isim/slogan taslağı.
- **Faz 3 (sonra):** localStorage → tenant DB (`brand_profiles` + RLS).

> ▎ **Tam AI marka *üretimi* (logo generation, brand book) YAGNI — dışarıda.** İçerik stüdyosunun tezi "ürün medyanı kullan, sıfırdan uydurma". Marka kimliği bir *girdi setup*'ı; sıfırdan marka doğuran bir üretici değil. (Tam kit → ayrı gün, `brandkit`.)

## Pipeline yerleşimi

```
Adım ⓪  MARKA (setup, bir kez)
         brand_profile ──────────────┐
                                      │  L2 metadata (BRAND_NAME, BRAND_VOICE,
                                      │  TONE, brand colors, vocab_overrides)
                                      ▼
Adım ①  Görsel/Video  →  Adım ②  Metin  →  Adım ③  Yayın planı
```

Marka setup'ı yapılmadan da pipeline çalışır (alanlar boş/fixture); ama auto-fill boş gelir. Setup = "bir kez doldur, her üretimde faydalan."

## Bitti sayılır (Faz 1 — Capture MVP)

- [ ] `brand_profile` şeması tanımlı (aşağıdaki data model)
- [ ] `/settings/brand` (veya Adım ⓪ paneli): form ile marka gerçekleri girilir
- [ ] Logo upload → asset ref olarak saklanır
- [ ] `brand_profile` localStorage'a yazılır/okunur (tenant DB Faz 3)
- [ ] Pipeline auto-fill: Adım ① analiz + Adım ② metin, `brand_profile` alanlarını L2 metadata'ya enjekte eder (`BRAND_NAME`, `BRAND_VOICE`, `TONE`)
- [ ] Boş marka durumu: setup yoksa üretim engellenmez; "markanı kur" nudge gösterilir
- [ ] #0011 engine fixture testi: `brand_profile` metadata'sı `composeInstruction`'a generic geçer (özel alan hard-code yok)

## Data model — `brand_profile`

```ts
interface BrandProfile {
  name: string                        // BRAND_NAME
  tagline?: string                    // slogan (opsiyonel)
  sector: "mobile-game" | "mobile-app" | "saas-web" | "furniture" | "other"
  colors: {
    primary: string                   // hex
    secondary?: string
    accent?: string
  }
  logo?: { assetId: string; mime: string }   // upload ref
  voice?: string                      // BRAND_VOICE — ör. "playful", "premium", "technical"
  tone?: string                       // TONE — ör. "friendly", "authoritative"
  vocabularyOverrides?: Record<string, string>  // marka özel isimler (ör. renk adları) → pack vocabulary patch
}
```

**Depolama:** Faz 1 localStorage (Can'ın tek-kullanıcı akışı yeterli) → Faz 3 tenant DB `brand_profiles` (`tenant_id` + RLS, ADR-0001).

**Metadata enjeksiyonu:** `brand_profile` → düz key-value → L2 context. Engine bunları **generic** okur; marka-özel dal yok. `vocabularyOverrides` pack merge'de `tenantOverride` olarak devreye girer (#0011 pack merge interface'i).

## #0011 ile bağ (gevşek bağlılık — kanıt)

- Engine `composeInstruction(metadata)` marka alanlarını generic okur → **fixture ile çalışır**, `brand_profile` olmadan da compose eder.
- #0012 #0011'e bağımlı **değil** (bağımsız ship edilebilir). #0011 de #0012'yi beklemez.
- Tek kesişim: #0011 Faz 3 UI dilimi, marka auto-fill'inden faydalanır — ama zorunlu değil (fixture BRAND_NAME ile geçer).

## Faz 2 — AI-assist (sonra, opsiyonel)

- [ ] Logo upload → vision ile dominant palet çıkar → `colors` öner
- [ ] Sektör + logo → `voice`/`tone` öner (mevcut `analyzeImage` altyapısı)
- [ ] Brief (tek satır) → isim/slogan taslağı (`generateText`)
- **Kredi:** Bu faz görsel/LLM çağrısı ister (Gemini/OpenRouter).

## Faz 3 — Tenant DB (sonra)

- [ ] localStorage `brand_profile` → tenant DB `brand_profiles` tablosu
- [ ] `tenant_id` + RLS (deny-default), audit
- **Bağımlılık:** #0004 tenant foundation, #0005 RLS. (Eski #0011 Faz 6'nın marka kısmı buraya taşındı.)

---

## Görev dökümü

| ID | Görev | Faz | Tahmini |
|----|-------|-----|---------|
| B1 | `brand_profile` şema + localStorage store | 1 | S |
| B2 | `/settings/brand` (Adım ⓪) form + logo upload | 1 | M |
| B3 | Pipeline auto-fill (L2 metadata enjeksiyonu) | 1 | S |
| B4 | Boş-durum nudge + #0011 fixture testi | 1 | S |
| B5 | AI-assist (palet/ton/slogan öneri) | 2 | M |
| B6 | Tenant DB migrasyonu + RLS | 3 | M |

S = küçük · M = orta

## Bağımlılıklar

- İçerik plugin mevcut (`packages/plugins/content`) + analyze/generateText altyapısı (Faz 2 için)
- #0011 pack engine — bağımsız, ama Faz 3 UI dilimi bu marka auto-fill'inden faydalanır
- #0004/#0005 tenant/RLS — sadece Faz 3

## Risk

- Marka kimliğini "AI üreteci" sanıp kapsamı şişirmek → **Faz 1 capture-only sınırı** net tutulacak
- localStorage → tenant DB geçişinde şema kayması → `brand_profile` şeması Faz 1'den itibaren tenant-uyumlu (sadece `tenant_id` eklenir)
- Boş marka ile üretim → auto-fill boş gelir; nudge ile yönlendir ama bloklamа

## Test planı

1. **Capture round-trip:** form doldur → localStorage yaz → reload → alanlar geri gelir
2. **Auto-fill:** `brand_profile` set → Adım ② metin üretiminde `BRAND_NAME`/`TONE` metadata'da görünür
3. **Gevşek bağlılık:** `brand_profile` yokken #0011 compose fixture ile çalışır (regression)
4. **Boş-durum:** setup yok → üretim engellenmez, nudge gösterilir

---

*Oluşturulma: 2026-07-06 (brainstorming: hybrid capture + Adım ⓪, #0011'den gevşek bağlı)*
