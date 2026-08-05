# ADR-0005 — Arka plan işleri: Redis-destekli kuyruk + server/worker ayrımı

- **Durum:** Önerildi (2026-08-05) — onay sonrası "Kabul"a çevrilecek
- **Bağlam:** Panelde 45 workflow, 4 zamanlanmış iş ve 2 subscriber var; content studio uzun-süren
  medya üretimi yapıyor. Hepsi bugün **bellek içi** motorda koşuyor. Kod-kanıtlı durum (2026-08-05):
  `helm/medusa-config.js` (78 satır) Redis modüllerinin hiçbirini kaydetmiyor, `helm/.env`'de
  `REDIS_URL` yok. Kayıt yokken Medusa varsayılana düşüyor
  (`packages/core/utils/src/modules-sdk/definition.ts:41,53` → `event-bus-local`,
  `workflow-engine-inmemory`). Buna karşılık `docker-compose.yml` içinde `redis:7-alpine`
  **zaten tanımlı** ve `helm-redis-1` container'ı ayakta — `PONG` veriyor, `dbsize=0`,
  hiç `bull:*` anahtarı yok. Yani altyapı duruyor, kablolama yok.

## Karar

1. **K1 — Redis üçlüsü kaydedilir:** `event-bus-redis`, `workflow-engine-redis`, `locking-redis`
   (`definition.ts:78-81`, `TEMPORARY_REDIS_MODULE_PACKAGE_NAMES`). BullMQ bu modüllerin
   içinde çalışır; **uygulama kodunda doğrudan BullMQ kullanılmaz.** Paralel kuyruk açmak
   framework'ün retry/compensation mekanizmasından kopuk iş üretir.
2. **K2 — Üretimde `server`/`worker` ayrımı.** `workerMode` desteği mevcut
   (`packages/core/types/src/common/config-module.ts:583` → `"shared" | "worker" | "server"`).
   API replikaları `server`, arka plan tek/az replika `worker`. Lokalde `shared` kalır.
3. **K3 — Uzun-süren iş HTTP isteğinden çıkar.** Kuyruğa taşınacak üç yer, öncelik sırasıyla:
   `api/admin/content/studio/draft/route.ts:29` (`await produceDraft(...)`, ölçülen ~8sn) ·
   Veo video (`lib/media/gemini-client.ts:107` `veoSubmit`, zaten operation-adı dönüyor) ·
   3D reconstruction (`lib/three-d/reconstruction/`, CPU-yoğun, dakikalar).
   Poll deseni `workflows/product-3d/poll-3d-asset.ts`'te zaten kurulu; şablon o.
4. **K4 — Her iş tenant bağlamı taşır.** Job payload'ında `tenant_id` zorunlu; worker işi
   almadan önce tenant oturumunu kurar (#0014'ün `set_config` kablolaması worker tarafında da
   gerekli). Kuyruk anahtarları tenant ön ekli olur (CLAUDE.md §5 cache kuralının kuyruk karşılığı).
5. **K5 — Redis yapılandırma kısıtı:** `appendonly yes` (kalıcılık) ve
   `maxmemory-policy noeviction`. Cache ile kuyruk aynı Redis'te ise `allkeys-lru` kuyruk
   anahtarlarını siler ve işler **sessizce** kaybolur.

## Gerekçe (kanıt)

- **Bugün kalıcılık yok.** Bellek içi motorda API süreci yeniden başladığında uçuşan her
  workflow kaybolur. Etkilenen yüzey: 45 workflow dosyası (loyalty 36 · content 4 · cms 3 ·
  tenant 2), 2 subscriber.
- **Çift koşma riski somut.** 4 cron bellek içi motorda her replikada ayrı çalışır:
  `content/jobs/social-snapshot.ts` (`0 */6 * * *`), `revenue/jobs/sync-admob.ts` ve
  `sync-revenuecat.ts` (`0 * * * *`), `revenue/jobs/sync-analytics.ts` (`15 3 * * *`).
  API'yi iki replikaya çıkarmak = çift senkron, çift dış-API maliyeti, bozuk snapshot.
- **A4 bunu zaten gerektiriyor.** ADR-0004 A4'ü "control-plane provisioning workflow → hazır
  panel" diye tanımlıyor. Yarıda kesilen provisioning = yarım tenant. Kalıcı motor olmadan
  A4 güvenle inşa edilemez.
- **Maliyeti düşük.** K1 uygulama kodu değiştirmez: `.env` + `medusa-config.js` modül kaydı.
  Redis container'ı zaten ayakta.

## Reddedilen alternatifler

- **Doğrudan BullMQ kuyruğu yazmak.** Medusa'nın workflow motoru zaten BullMQ kullanıyor.
  Yanına ikinci kuyruk = iki retry politikası, iki ölü-mektup kutusu, compensation'dan
  kopuk işler. Reddedildi.
- **RabbitMQ / harici broker.** Repoda hiç iz yok (`amqplib` 0 eşleşme), Medusa'nın
  desteklediği yol Redis. Ek operasyon yükü karşılığında kazanç yok. Reddedildi.
- **Bellek içinde kalıp tek replika ile devam.** Kısa vadede çalışır ama A4'ü ve ilk gerçek
  müşteriyi bloklar (ADR-0004: "Production deploy pipeline yok; ilk gerçek müşteriden önce
  kurulmalı"). Ertelenmiş maliyet. Reddedildi.

## Sonuçlar

- ✅ 45 workflow + 4 cron tek satır uygulama kodu değişmeden kalıcı ve dağıtık olur.
- ✅ API yatay ölçeklenebilir hale gelir; cron'lar `worker` sürecinde tekilleşir.
- ⚠️ **K4, #0014'e bağımlı.** Worker tarafında tenant oturumu kurulmazsa arka plan işleri ya
  RLS'e takılır ya çapraz-tenant sızdırır. #0014 Slice 2 (`set_config`) worker yolunu da kapsamalı.
- ⚠️ Redis artık **kritik bağımlılık** — düşerse cron ve kuyruk durur. Üretimde yönetilen
  servis (kalıcılık + failover) önerilir.
- ⚠️ `WESANJS-SPEC.md §5`'in "Redis opsiyonel" ifadesi bu ADR ile güncellendi: tek süreçli
  dev için opsiyonel, çok replikalı veya uzun-süren işli kurulumda **zorunlu**.

## Sıralama (ADR-0004 kuyruğunu bozmaz)

Bu ADR ürün adımı değil, altyapı. A1→A5 kuyruğuna girmez; ona paralel iner.

1. **Şimdi (A1 ile birlikte):** K1 + K5 — modül kaydı, `.env`, Redis ayarları. Kod değişmez.
   K4'ün worker ayağı #0014 Slice 2 ile aynı commit'te tasarlanır.
2. **A4 öncesi (kapı):** K2 — `server`/`worker` ayrımı + deploy pipeline. Provisioning
   workflow'u buna dayanır.
3. **Sıra dışı, UX tetikli:** K3 — `studio/draft` kuyruğa (en görünür kazanç: 8sn → anında),
   sonra Veo, en son reconstruction worker'ı ayrı sürece.

İlgili: [ADR-0004](0004-product-sequence-composable-panel.md) (build kuyruğu · A4 provisioning) ·
[ADR-0001](0001-multi-tenancy.md) (izolasyon) · tasks/0014 (RLS + worker tenant bağlamı) ·
[WESANJS-SPEC §5](../specs/WESANJS-SPEC.md) (altyapı).
