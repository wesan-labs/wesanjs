# ADR-0004 — Ürün sırası (A→B) + kompoze panel: iki-zone sidebar & sektör setleri

- **Durum:** Kabul (2026-07-15)
- **Bağlam:** Lovable-tarzı AI webshop builder ekranları ürün kimliği sorusunu zorladı:
  biz operasyonel **admin panel platformu** muyuz (A), müşteriye-dönük **webshop builder** mı (B)?
  Backend audit'i (2026-07-10, kod-kanıtlı): storefront/marketing frontend YOK; deploy sadece
  lokal `medusa develop`; app-layer tenant izolasyonu **çalışıyor** (`plugins/tenant/src/api/middlewares.ts:24-71` —
  sahte `x-tenant-id` → 403); RLS policy'leri yazılı ama **uykuda** (`SET app.current_tenant_id`
  hiç çağrılmıyor); RBAC altyapısı var ama **kozmetik** (hiçbir route `policies` deklare etmiyor,
  feature flag kapalı); Medusa core (product/order/customer) tenant-scoped **değil** (#0005 backlog).

## Karar

1. **K1 — Ürün sırası: önce A, sonra B.** A = işletmelerin operasyonel admin paneli
   (dikey setler + yetenek paketleri + AI panel composer). B = müşteriye-dönük webshop/site
   builder (storefront + görsel editör + hosting) — kuzey yıldızı; Faz A bitmeden başlanmaz.
2. **K2 — Path 1 teyit: paylaşımlı multi-tenant** (ADR-0001'in kararı geçerli). Composer'ın
   "dakikalar içinde workspace" vaadi deployment-per-tenant ile karşılanamaz.
3. **K3 — Sidebar = iki zone:** main = müşterinin dikeyi (aldığı sektör paneli),
   Extensions = yetenek paketleri (tekrar-satılan). Set = satılabilir birim; dikey ve
   yetenek **aynı mekanizma** (plugin + `defineRouteConfig`). Detay:
   [SECTOR-SETS-SPEC](../specs/SECTOR-SETS-SPEC.md) · süreç: [PLUGIN-DEV-PROCESS](../specs/PLUGIN-DEV-PROCESS.md).
4. **K4 — AI composer Faz A'da SADECE panel kurar** (tenant yarat + entitlement satırları +
   set seed'i). Site/mobil üretimi B'ye park. Composer'ın yazdığı şey = #0006'nın
   "kur" akışı; yeni bir mekanizma icat etmez.

## Gerekçe (kanıt)

- **B'nin gerçek maliyeti:** builder ekranlarının dekompozisyonu 7 alt-sistem; AI/intent
  kısmı en kolay ~%10. Dağ = storefront render + görsel editör (selection-mode) +
  multi-tenant hosting/publish — üçü de bizde **sıfır**. A'nın alt-sistemleri ise büyük
  ölçüde var: tenant+üyelik ✅, workflow engine+Redis ✅, Gemini tesisatı (content plugin) ✅,
  idempotent seed ✅, yetenek pluginleri (cms/content/revenue/mail/loyalty) ✅.
- **A'nın provisioning workflow'u B'nin motoru:** "workspace kuruluyor" adımı yarın
  "storefront ayağa kaldır" adımını da alır — A doğru kurulursa B'nin temeli bedavaya gelir.
- **3-deneme kalıbı:** önceki üç denemede modül-kompozisyon wiring'i hiç bitmedi
  (old-levios, nexpaces). Sebep mimari değil kapsam şişmesiydi. A→B sıralaması +
  kapılı kuyruk bunun panzehiri.

## Reddedilen alternatifler

- **Önce B (webshop builder):** 5-6 büyük alt-sistemden ~1,5'i mevcut; iyi-fonlanmış ekip
  ölçeği. Mevcut admin-panel yatırımını kritik yoldan çıkarır.
- **A+B paralel:** iki cephe = 4. kez bitirmeme senaryosu.
- **Path 2 (deployment-per-tenant):** izolasyon bedava ama anında-provision ve
  self-serve signup pratikte ölür; ops maliyeti tenant sayısıyla lineer büyür.

## Sonuçlar

- ✅ Mevcut yatırım (tenant, RBAC altyapısı, pluginler, seed) kritik yolda kalır; çöp yok.
- ⚠️ A4 composer'dan önce **public signup/davet akışı** şart — bugün sadece var-olan
  user üye eklenebiliyor (members POST, yoksa 404).
- ⚠️ **#0005 (core tenant-scoping) = kapı:** 2. commerce tenant'ı almadan önce zorunlu;
  demo aşamasında bloklamaz.
- ⚠️ Production deploy pipeline yok; ilk gerçek müşteriden önce kurulmalı.
- 🚪 B başladığında ilk iş: Medusa Next.js storefront'unu çok-kiracılı publish hedefi yapmak.

## Sıralama (build kuyruğu — kapılı)

1. **A1 — Güvenlik temeli** (#0014): RLS'i uyandır (middleware `set_config`) + kritik
   route'lara RBAC `policies` (finance pilot #0008 şablonuyla).
2. **A2 — Entitlement** (#0006): tablo + guard + sidebar filtresi (RBAC ∩ paket).
3. **A3 — İkinci set:** ilk commerce-dışı dikey (klinik/ajans adayı) —
   PLUGIN-DEV-PROCESS 6-adım. "AI seçiyor" demosu ≥2 set ister.
4. **A4 — Composer v1:** signup/davet + marketing yüzeyinde sohbet (friday) →
   control-plane provisioning workflow → hazır panel. Ödeme/abonelik A4 **sonrası**.
5. **KAPI → A5 — Core tenant-scoping** (#0005): 2. commerce tenant'tan önce zorunlu.

İlgili: [ADR-0001](0001-multi-tenancy.md) (izolasyon+kompozisyon) · tasks/0004-0009, 0014 ·
[identity-and-tenancy](../architecture/identity-and-tenancy.md) (kimlik modeli + izolasyon durumu).
