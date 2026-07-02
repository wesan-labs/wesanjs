# SaaS Paneli + Atölye Paneli — Detaylı İş Dökümü

> **Tarih:** 2026-07-01 · **Kaynak kanıt:** `docs/research/2026-06-29-sector-module-map.md` (kod-denetimli) + bu oturumda canlı doğrulanan durumlar (aşağıda işaretli).
> **Yöntem:** Her kalem = Ne / Mevcut taban (kanıt) / Katmanlar / Ekran / Efor. Rozetler: ✅ var-çalışır · 🟡 kısmi · 🔴 yok/iskelet · 🔮 yeni.

## 0) 06-29 haritasından bu yana değişenler (bu oturumda doğrulandı)

| Birim | 06-29 durumu | Bugün (kanıt) |
|---|---|---|
| revenue admin UI | "eksik" | ✅ VAR — P&L hero, donut, KPI+sparkline, dönem seçici, gider modalı, i18n (`routes/revenue`) |
| cms migration | "YOK — boot'ta tablo kurmaz" | ✅ VAR — tablolar canlı, entry save 200 (canlı test) |
| cms admin UI | "boş" | ✅ VAR — Studio: schema-driven editör + designer + SEO paneli + delivery + i18n |
| cms collections API | "yok" | ✅ VAR — `admin/cms/collections/[id]` canlıda 200 |
| cms delivery | — | ✅ VAR — `GET /cms/:slug?preview=` canlıda 200 |
| tenant | 🟡 iskelet | 🟡→ **A1 BİTTİ (2026-07-01):** tenant-context middleware (`tenant/src/api/middlewares.ts`, x-tenant-id→membership→403) + cms pilot izolasyonu (tenant_id migration + route guard'ları + RLS 3/3 tablo, old-levios cad08cf80 port'u `helm/src/scripts/enable-rls-cms.ts`). KANIT: DB-seviyesi (levios_app rolü: wesan=1/1/1, beta=0/0/0, cross-UPDATE=0 satır) + API-seviyesi (header'sız=legacy, wesan=1, beta=0, cross-detay=404, üye-olmayan=403). Kalan: A2 API+ekran, diğer plugin'lerin scope'lanması, levios_app bağlantısına geçiş |

Bu oturumda ayrıca kanıtlanan **operasyonel boşluklar**:
- **Hata izleme YOK** — Sentry yalnız `connections` ekranında ikon/kart; `@sentry` dep'i hiçbir pakette yok.
- **Audit log YOK** — hiçbir pakette `audit` izi yok.
- **Analytics persistence YOK** — `packages/modules/analytics/src` altında `models/` klasörü yok; sadece provider relay.
- **Job fail = sessiz ölüm** — `revenue/src/jobs/sync-*.ts` içinde `catch` yok; sync patlarsa kimse duymaz.
- **cms entry update MERGE yapıyor** (replace değil) — top-level bölüm silme persist olmaz (canlı test, bilinen bug).

---

# TRACK A — SaaS PANELİ

## A-Çekirdek (omurga)

### A1 · Tenant izolasyonu — RLS + tenant context 🔴→
- **Ne:** İstek → tenant çözümü (JWT/membership) → her sorgu tenant-scoped. Postgres RLS: feature tablolarına `tenant_id` + policy (`SET app.tenant_id` GUC deseni). Cache key'lerine tenant prefix'i.
- **Taban:** `tenant` plugin: Tenant + TenantMembership modeli + DDL migration ✅; **RLS SQL yazılmamış, middleware yok, service stub** (kod tarandı).
- **Katmanlar:** migration (RLS policy'ler + feature tablolarına tenant_id) · middleware (context çözümü) · service scoping · **izolasyon testi: 2 tenant yan yana sızıntı yok** (bitti sayılma şartı).
- **Kapsanacak feature tabloları:** cms_site/collection/entry · revenue (source/event/snapshot/expense) · loyalty · content — bugün hiçbirinde tenant_id yok (kanıt: model grep = 0).
- **Efor:** M-L · **Risk:** üç denemenin öldüğü yer burası; dilim küçük tutulmalı (önce 1 plugin, ör. cms, uçtan uca).

### A2 · Tenant yaşam döngüsü + yönetim ekranı 🔴
- **Ne:** Tenant CRUD + üye davet/çıkar + rol atama (workflow'lu, compensation'lı). Signup→provision akışı (yeni tenant → default plan + default rol + örnek veri).
- **Ekran:** master-detail — üstte kompakt tenant listesi (ad/slug/plan/durum/üye sayısı), altta seçili tenant: **Üyeler / Plan / Ayarlar** sekmeleri. Davet = e-posta + rol seçimli satır-içi form. Boş/yükleniyor/hata durumları, i18n (en+tr).
- **Efor:** M

### A3 · RBAC enforcement + rol ekranı 🟡→
- **Ne:** `rbac` modeli ✅ (Role/Policy/RolePolicy/RoleParent, cycle-detection) ama **fiilen hiçbir şeyi zorlamıyor**. (1) rol/policy CRUD API, (2) **enforcement middleware**: route→policy→kullanıcının tenant-scoped rolleri→deny-default, (3) audit'e karar yaz (A8 ile bağ).
- **Ekran:** sol rol listesi + sağ **policy matrisi** (kaynak × eylem grid'i, satır başına toggle; kompakt, sayfalama değil grup-akordeon). Rol hiyerarşisi breadcrumb'la.
- **Efor:** M

### A4 · Entitlement / paywall + plan ekranı 🔮
- **Ne:** SaaS'ın kalbi. `Plan` (tier, fiyat ref) + `PlanFeature` (feature key, tip: bool/limit) + `TenantPlan` bağı. Runtime servis: `hasFeature(tenant, key)` / `getLimit(tenant, key)`. Frontend: `useEntitlement()` hook + `<FeatureGate feature="x">` bileşeni (kilitli durumda upgrade-CTA).
- **Taban:** rbac+revenue+settings wiring'i (haritadaki #3); model 🔮 yeni ama küçük.
- **Ekran:** **plan kartları** yatay (Free/Pro/Enterprise — fiyat + öne çıkan feature'lar) + altta **feature matrisi** (feature × plan grid'i; limit hücreleri inline-edit). Alan kullanımı: kartlar üstte vitrin, matris altta çalışma alanı.
- **Efor:** M

### A5 · Subscription lifecycle + billing ekranı 🟡→
- **Ne:** `revenue`'yu "topla"dan yaşam döngüsüne: `Subscription` entity + **durum makinesi** (trial→active→past_due→canceled/frozen), renewal job, **dunning** (fail→retry N→freeze→entitlement kilidi A4'e), cancel/freeze workflow, **webhook secret doğrulama kodu** (tanımlı ama doğrulanmıyor — haritada kanıtlı), Stripe/Iyzico reconciliation.
- **Ekran (tenant-billing):** mevcut plan + sonraki fatura tarihi hero'su · fatura geçmişi tablosu · ödeme yöntemi kartı · plan değiştir/iptal akışı (onay modalı, downgrade uyarısı).
- **Efor:** M-L

### A6 · Onboarding + takım 🔮
- **Ne:** Signup → tenant provision → davet linki → rol ile katılım. İlk-giriş checklist'i (entegrasyon bağla, ilk içerik, ilk üye).
- **Ekran:** 3-adımlı kurulum sihirbazı (ilerleme çubuğu) + dashboard'da kapatılabilir checklist kartı.
- **Efor:** M

## A-Operasyon (eksik olduğu tespit edilen katman)

### A7 · Hata/çökme izleme (Sentry) 🔴
- **Ne:** Backend (Medusa instrumentation) + admin (React SDK + ErrorBoundary'e bağla). Sourcemap upload. Tenant tag'i her event'e.
- **Kanıt:** `@sentry` dep'i YOK; connections'ta sadece UI kartı var → kart gerçek entegrasyona bağlanır.
- **Ekran:** connections'taki Sentry kartı → DSN girişi + durum rozeti. (Hata listesi Sentry'de kalır; panelde sadece sağlık özeti.)
- **Efor:** S · **Öncelik yüksek:** her şeyin görünürlük temeli; ucuz.

### A8 · Audit log 🔴
- **Ne:** `AuditEvent` modeli (tenant_id, actor, action, resource, before/after özeti, decision_id) — RBAC kararları (A3) + kritik mutasyonlar (workflow hook'larından) yazar. KVKK: PII maskeli.
- **Ekran:** filtreli tablo (aktör/kaynak/tarih aralığı) + satır-detay drawer (before/after diff). Export CSV.
- **Efor:** M

### A9 · Uyarı/alert merkezi 🔴
- **Ne:** Panelin "çökme uyarıları vs" katmanı. `Alert` modeli (tenant, severity, kind, payload, okundu) + üreticiler: **ödeme düştü** (A5 dunning), **sync fail** (revenue job'larına catch+alert — şu an sessiz ölüyor, kanıtlı), **kota %90/%100** (A11), **webhook hatası**, **RLS ihlal denemesi**. Kanallar: in-app + e-posta (notification) + SMS/WA (A12).
- **Ekran:** topbar zil + **inbox deseni** (sol severity/tür filtresi, sağ liste + detay); kritik uyarılar dashboard'da banner.
- **Efor:** M

### A10 · Analytics'i bitir (ürün analitiği) 🟡→
- **Ne:** `analytics` modülü provider-relay ✅ ama **persistence yok** (models/ yok — kanıt). `AnalyticsEvent` modeli (tenant_id, event, actor, props, ts) + ingest + günlük rollup job + sorgu API'si (seri/koni).
- **Ekran:** tenant-scoped dashboard — DAU/WAU kartları (kit StatCard+sparkline **yeniden kullan**), olay hacmi trendi (AreaChartPanel), en çok olaylar BarList; tarih aralığı seçici (revenue'daki 7g/28g deseniyle aynı).
- **Efor:** M · **Not:** dashboards/kit zaten var — ekran ucuz, değer yüksek.

### A11 · Kota / usage metering 🔮
- **Ne:** Entitlement limitlerini (A4) gerçek sayaçlara bağla: `UsageCounter` (tenant, key, period, value) — API çağrısı, storage, seat, içerik sayısı. Limit aşımında: soft-warn (A9 alert) → hard-block (FeatureGate).
- **Ekran:** billing sayfasında kullanım çubukları (kota bar'ları, %90'da amber) — plan kartının hemen altı.
- **Efor:** M

### A12 · SMS/WhatsApp gateway 🔮 (haritada #4, S efor)
- **Ne:** `notification`'a SMS/WA provider (Twilio/Netgsm adaptörü). A9 uyarıları + Track B'nin tüm müşteri mesajları bunu kullanır.
- **Efor:** S · **Sıra:** B'den önce şart.

### A13 · KVKK/GDPR: veri ihracı + silme 🔮
- **Ne:** Tenant-verisi export (JSON/CSV, job'lu) + müşteri silme talebi workflow'u (soft-delete + anonimleştirme). Audit'e yazılır.
- **Ekran:** tenant Ayarlar sekmesinde "Veri" bölümü — export butonu + talep geçmişi.
- **Efor:** S-M

### A14 · Sağlık/health + status 🔮
- **Ne:** `/health` (derin: DB+Redis+dış API) + admin'de sistem durumu kartı (son sync zamanları, job durumları — revenue sync'in en son ne zaman başarılı olduğu şu an görünmüyor).
- **Ekran:** Ayarlar → Sistem: servis satırları (yeşil/amber/kırmızı nokta + son başarı zamanı).
- **Efor:** S

---

# TRACK B — ATÖLYE PANELİ (made-to-order · baban)

> Taban: standart commerce (product/order/payment/inventory) ✅; atölye akışı 🔮. `draft-order` 🔴 (87 admin dosyası, backend 0 — kanıt) → B2'nin ilk işi onun backend'i.
> Haritadaki kaldıraç: bu çekirdek mobilya + mutfak/doğrama + mermer + terzi + özel-pasta + oto-servis(kısmen) dikeylerini açar.

### B1 · Müşteri kartı + keşif 🔮
- **Ne:** Lead → müşteri; **ölçü alma randevusu** (basit slot — tam booking omurgası DEĞİL, tek-kaynak takvim), keşif notları + ölçü/foto ekleri (file modülü), iletişim geçmişi.
- **Ekran:** müşteri kartı — sol kimlik/iletişim, sağ sekmeler: **İşler / Ölçüler & Fotoğraflar / Mesajlar**. Foto grid'i lightbox'lı.
- **Efor:** M

### B2 · RFQ / Teklif 🔴→🔮
- **Ne:** Önce `draft-order` backend'i (model/service/api/workflow — şu an 0). Üstüne: konfigürasyon satırları (ölçü W×H×D, malzeme seçimleri), **teklif versiyonlama** (v1/v2, geçerlilik tarihi), müşteri onay linki (public, imza/onay), PDF çıktı.
- **Ekran:** **teklif oluşturucu** — sol: satır listesi (konfigürasyon formu satır-içi), sağ sabit **canlı fiyat özeti** paneli (malzeme+işçilik+marj kırılımı). Üstte versiyon sekmeleri. Alan kullanımı: iki-pane, sağ panel sticky.
- **Efor:** L

### B3 · Dinamik fiyat motoru 🔮
- **Ne:** m²/metretül kural motoru: `PriceRule` (malzeme × birim × formül) + malzeme fiyat listesi (tedarikçi fiyatı + fire % + işçilik katsayısı). `pricing` statik — bunu tamamlar.
- **Ekran:** kural tablosu + **test hesaplayıcı** paneli (ölçü gir → anlık fiyat kırılımı; teklifle aynı bileşen).
- **Efor:** M
- **Karmaşıklık:** kural değerlendirme O(kural sayısı) — kural başına önceden derlenmiş formül, per-satır cache.

### B4 · BOM + malzeme rezervasyonu 🔮
- **Ne:** Ürün-konfigürasyonundan malzeme reçetesi (`BomLine`: malzeme, miktar formülü, fire) → teklif onaylanınca `inventory` rezervasyonu → iş-emri aşamasında düşüm. **Kritik stok uyarısı** (A9 alert altyapısına) + eksik malzeme → satınalma ihtiyacı listesi.
- **Ekran:** iş-emri detayında Malzeme sekmesi (rezerve/düşüldü/eksik rozetleri); global **Malzeme ekranı**: stok seviye çubukları, kritik eşik altı üstte kırmızı grupta.
- **Efor:** M-L

### B5 · Üretim iş-emri (Kanban) 🔮
- **Ne:** `WorkOrder` + `WorkOrderStage` durum makinesi (ölçü→kesim→montaj→boya/döşeme→kalite→hazır — **aşamalar tenant-ayarlı**, settings'e). Aşama atama (usta), planlanan/gerçekleşen süre, foto ekleri, aşama-geçiş workflow'u (compensation'lı).
- **Ekran:** **Kanban panosu** — sütun=aşama, kart=iş (müşteri, ürün, termin, gecikme rozeti kırmızı); kart tıklanınca detay drawer: zaman çizelgesi + fotolar + malzeme + notlar. Sürükle yerine aşama-ilerlet butonu (dnd-kit dep'i yok — mevcut karar).
- **Efor:** L

### B6 · Ödeme planı: kapora + bakiye/taksit 🔮
- **Ne:** `PaymentPlan` (teklif toplamı → kapora % + taksit satırları, vade tarihleri) + tahsilat kaydı + **vadesi gelen/geciken taksit uyarısı** (A9) + müşteriye SMS hatırlatma (A12).
- **Ekran:** iş detayında Ödeme sekmesi: plan satırları (ödendi/bekliyor/gecikti rozetleri) + tahsilat ekle butonu; dashboard'da "bu hafta vadesi gelenler" kartı.
- **Efor:** M

### B7 · Teslimat + montaj 🔮
- **Ne:** Hazır iş → teslimat/montaj randevusu (B1'deki basit slot takvimi paylaşılır), montaj tamamlama onayı (foto + müşteri imza/onay), işi kapat.
- **Ekran:** haftalık takvim görünümü (gün sütunları, iş kartları) + gün-detay listesi.
- **Efor:** M

### B8 · Garanti + servis kaydı 🔮
- **Ne:** Kapanan işe garanti süresi; servis talebi kaydı (şikayet → keşif → onarım mini-iş-emri, B5'i yeniden kullanır).
- **Ekran:** müşteri kartında Garanti sekmesi; basit talep listesi.
- **Efor:** S

### B9 · Atölye raporları + operasyonel uyarılar 🔮
- **Ne:** İş başına **marj** (teklif fiyatı − gerçek malzeme − işçilik saat), aşama süreleri (nerede darboğaz), termin performansı (geciken %), aylık ciro. **Uyarılar (A9 altyapısı):** geciken iş-emri, termine ≤3 gün kalan işler, kritik stok, geciken taksit.
- **Ekran:** dashboards/kit ile — StatCard'lar (aylık ciro/açık iş/geciken), aşama-süre BarList, marj tablosu. Revenue ekranıyla aynı görsel dil.
- **Efor:** M

### B10 · Müşteri mesajları (SMS/WA şablonları) 🔮
- **Ne:** A12 gateway üstüne atölye şablonları: "teklifiniz hazır (link)", "üretim tamamlandı", "montaj randevunuz X", "taksit hatırlatma". Gönderim logu müşteri kartına.
- **Efor:** S (A12 sonrası)

---

# Sıralama önerisi (çıkarım — onaya sunulur)

| Faz | İçerik | Neden önce | Efor |
|---|---|---|---|
| **A-0** | A7 Sentry + revenue job'larına catch→alert (A9'un tohumu) | Görünürlük temeli; ucuz; "sessiz ölüm" bugün gerçek | S |
| **A-1** | A1 tenant RLS+context (önce tek plugin: cms) → A2 tenant ekranı | İzolasyon her şeyin öncülü; SaaS iddiasının kendisi | M-L |
| **A-2** | A3 rbac enforcement → A4 entitlement → A11 metering | Deny-default + plan kilidi = satılabilir SaaS | M+M |
| **A-3** | A5 subscription lifecycle + billing ekranı + A9 alert merkezi | Gelirin yaşam döngüsü + uyarılar | M-L |
| **A-4** | A10 analytics + A8 audit + A6 onboarding + A13/A14 | Operasyonel olgunluk | M |
| **B-0** | A12 SMS/WA (B'nin önkoşulu) | S efor, iki track de kullanıyor | S |
| **B-1** | B2 RFQ (draft-order backend dahil) + B3 dinamik fiyat | Atölyenin para kazanan akışı teklifle başlar | L |
| **B-2** | B5 iş-emri Kanban + B4 BOM | Üretim görünürlüğü | L |
| **B-3** | B6 ödeme planı + B7 teslimat + B1 müşteri kartı | Tahsilat + operasyon | M |
| **B-4** | B9 raporlar + B8 garanti + B10 mesaj şablonları | Olgunlaştırma | M |

**Ekran ilkeleri (tüm yeni ekranlar):** design-system bileşenleri + `dashboards/kit` yeniden kullanımı · master-detail/iki-pane desenleri · boş-yükleniyor-hata durumları zorunlu · i18n (en+tr) zorunlu · özel CSS class YOK · tablo yerine yoğunluk gerektiren yerde matris/kanban/inbox desenleri.

**Bitti sayılma (her kalem):** typecheck + (backend ise) canlı endpoint testi + izolasyon/enforcement kalemlerinde negatif test (yetkisiz/yanlış-tenant isteği REDDEDİLİYOR kanıtı).
