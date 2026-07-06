# content — AI içerik stüdyosu + sosyal snapshot   🟡 Kısmi (ileri)

## Ne yapar
Görsel/metin/video-prompt üretimi (vision LLM) + içerik kütüphanesi + günlük sosyal metrik snapshot (tren için).

## Tür & katman
- **Tür:** plugin (content)
- **Katman:** domain / içerik üretimi + sosyal analitik
- **tenant_id taşıyor mu:** Evet (nullable, `tenant_default` varsayılan değeriyle)

## Mimari / katmanlar
| Katman | Var mı | Sayı/İçerik |
|---|---|---|
| models | ✅ | 2 (ContentItem, SocialSnapshot) |
| services | ✅ | 2 modül (content-library, social-snapshot) |
| api | ✅ | 14 route |
| admin | 🔴 | YOK |
| workflows | ✅ | 2 workflow |
| jobs | ✅ | 1 cron (social-daily-snapshot, 6h) |
| migrations | ✅ | 3 migration |

Ek: lib/ai (content-generator 700 satır) · lib/social.

## Veri modeli
- **ContentItem** — kind, title, value, language, platform, prompt_id
- **SocialSnapshot** — account_id, platform, date, metrics (jsonb)

## Public yüzey
- `GET/POST /items`
- `POST /generate` (OpenRouter/Gemini fallback → GenerationResult)
- `POST /analyze`
- `POST /edit-image`
- `/prompts`
- `social/{accounts,connect,publish,snapshot,trends,analytics}`
- `sector-packs.ts` 4 dikey (mobile-game / mobile-app / saas-web / furniture)

## Bağımlılıklar & linkler
- env: `ZERNIO_API_KEY`, `IMAGE_HOST` (imgbb/cloudinary), OpenRouter/Gemini key
- Dış servis: Zernio/Late (sosyal), imgbb/cloudinary (görsel host)

## Pack & Template Engine (hedef mimari)

Görsel üretim çekirdeği generic prompt kütüphanesi değil; **Pack + deterministik template engine** olacak (Bega Home `scripts/` modeli). Detay: [content-studio-pack-engine.md](../content-studio-pack-engine.md) · iş planı: [tasks/0011](../tasks/0011-content-studio-pack-engine.md).

## Durum
- **Yapılan:** content-generator (vision → prompt → LLM fallback → JSON validate), snapshot cron (idempotent), image-host (imgbb/cloudinary), admin UI (İçerik Stüdyosu), sector-packs (26 transform prompt).
- **Pürüzlü:** 96 legacy `image-prompt` (Midjourney/duplicate); görsel pipeline 2-hop LLM; pack engine henüz yok.
- **Yapılmayan/eksik:** Pack loader + compose API; prompts DB storage yok; Zernio/Late OAuth handshake tam değil — **sosyal publish server-side YOK, sadece tarayıcı-widget (bilinen tavan)**.
- **Yapılacak (sıralı):**
  1. **Pack & template engine** (#0011) — görsel çekirdek
  2. Tenant brand profile DB
  3. Batch job (Bega Home progress pattern)
  4. OAuth handshake (sosyal)

## Hizmet ettiği dikeyler
İçerik üretici/medya (ev sahası), mobil oyun, app/saas, DTC, el yapımı.

## Kanıt yolları
- `packages/plugins/content/src/lib/ai/content-generator`
- `packages/plugins/content/src/lib/social`
- `packages/plugins/content/src/api`
- `packages/plugins/content/src/modules`
