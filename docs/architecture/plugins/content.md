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

## Durum
- **Yapılan:** content-generator (vision → prompt → LLM fallback → JSON validate), snapshot cron (idempotent), image-host (imgbb/cloudinary).
- **Yapılmayan/eksik:** admin UI; analyze impl boş; edit-image stub olabilir; prompts DB storage yok; Zernio/Late OAuth handshake tam değil — **sosyal publish server-side YOK, sadece tarayıcı-widget (bilinen tavan)**.
- **Yapılacak (sıralı):**
  1. admin composer
  2. analyze impl
  3. image editor
  4. prompt DB
  5. OAuth handshake

## Hizmet ettiği dikeyler
İçerik üretici/medya (ev sahası), mobil oyun, app/saas, DTC, el yapımı.

## Kanıt yolları
- `packages/plugins/content/src/lib/ai/content-generator`
- `packages/plugins/content/src/lib/social`
- `packages/plugins/content/src/api`
- `packages/plugins/content/src/modules`
