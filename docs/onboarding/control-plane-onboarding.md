# Control plane onboarding

Levios admin panelinde **organizasyon (tenant)**, **takım üyeliği** ve **modül izinleri (RBAC)** nasıl çalışır — hem son kullanıcı hem operasyon ekibi için.

Bu doküman onboarding checklist'i, destek script'i ve pilot müşteri kurulum rehberi olarak kullanılır.

---

## 1. Kavramlar (5 dakika)

### Organizasyon ≠ Mağaza (Store)

| Kavram | Ne? | Nerede? |
|--------|-----|---------|
| **Organizasyon** | SaaS çalışma alanı; veri scope'u (`tenant_id`) | Header dropdown · Settings → Organizasyon |
| **Store** | Medusa commerce (ürün, sipariş, bölge…) | Settings → Genel → Mağaza |

Bir kullanıcı birden fazla organizasyona üye olabilir. Header'dan **aktif org** seçilir; tüm plugin verisi (revenue, content, cms) o org'a scope'lanır.

### İki yetki katmanı

```
┌─ Organizasyon üyeliği ─────────────────────────────┐
│  Kim bu org'da? Kim üye ekler/çıkarır?             │
│  Roller: admin · manager · member                  │
│  UI: Settings → Organizasyon → Takım             │
└────────────────────────────────────────────────────┘
┌─ RBAC (modül izinleri) ────────────────────────────┐
│  Hangi modül/API'lere erişilir?                    │
│  Örnek: revenue:read · expense:create              │
│  UI: Settings → Roller · Policies                  │
│  Not: #0007 ile tenant-içi olacak; bugün global   │
└────────────────────────────────────────────────────┘
```

**Kullanıcıya söylenecek kısa cümle:** “Şirket seçimi üstte; menüde ne görüyorsan o şirketin verisi. Kimin muhasebe göreceği ise Roller'den.”

---

## 2. İlk kurulum (platform operatörü)

Hedef: Helm + dashboard ayakta, RBAC açık, en az bir org ve admin hazır.

### 2.1 Ortam

```bash
# Terminal 1 — backend
cd helm && npm run dev

# Terminal 2 — dashboard
cd wesanjs/packages/admin/dashboard && npm run dev
```

`.env` kontrolü:

- `MEDUSA_FF_RBAC=true`
- `DATABASE_URL`, CORS (`ADMIN_CORS` → `http://localhost:5173`)

### 2.2 Veritabanı

```bash
cd helm && npm run db:migrate
```

Beklenen:

- `tenant` / `rbac` tabloları
- Plugin `tenant_id` + RLS migration'ları (cms, content, revenue)
- `create-super-admin-role` script'i (RBAC modülü yüklüyse admin'e `role_super_admin`)

**Sorun:** Script RBAC'tan önce çalıştıysa kullanıcıda rol yok.

```bash
# script_migrations'dan create-super-admin-role.js satırını sil, sonra:
npx medusa db:migrate:scripts
```

### 2.3 İlk giriş

1. `http://localhost:5173/login`
2. Admin kullanıcı (ör. `admin@helm.local`)
3. Super admin tüm modülleri görür (`*:*` policy)

---

## 3. Organizasyon kurulumu (müşteri / pilot admin)

### Adımlar

1. **Header** → workspace dropdown (veya Settings → Organizasyon)
2. **Yeni organizasyon** → ad + slug
3. Org seçili kaldığından emin ol → banner: “İstekler bu organizasyona scope'lu (x-tenant-id)”
4. **Settings → Organizasyon → Takım** → e-posta ile üye davet et
5. Üyelik rolü seç:
   - **admin** — org yönetimi (üye ekle/çıkar)
   - **manager** — (ileride genişletilecek)
   - **member** — standart üye

### Kullanıcı deneyimi

- Org değiştirmek **sayfa yenilemeden** çalışır
- Yanlış org veya üye olunmayan org → API **403**
- Legacy mod: header'da org yoksa tüm tenant verisi görünür (geliştirme geri uyumu; prod'da org zorunlu tutulmalı)

---

## 4. RBAC — Finance pilot rolü (onboarding şablonu)

İlk “gerçek” kısıtlı rol: muhasebe / finans ekibi. Revenue panosu + gider; app/sync ayarları yok.

### 4.1 Hazır roller (seed)

Migration script `seed-finance-role` çalışınca:

| Rol ID | Ad | Policy'ler |
|--------|-----|------------|
| `role_super_admin` | Super Admin | `*:*` (her şey) |
| `role_finance` | Finance | `revenue:read`, `expense:create`, `expense:delete` |

```bash
cd helm && npx medusa db:migrate:scripts
# seed-finance-role.js + seed-finance-pilot-user.js listede görünüp çalışmalı
```

**Pilot kullanıcı (otomatik seed):**

| Alan | Değer |
|------|-------|
| E-posta | `finance@helm.local` |
| Şifre | `financesecret123` |
| RBAC | Sadece `role_finance` (super admin yok) |
| Org | Acme'de Finance (`tenant_acme` membership `rbac_role_id`); Beta'da modül izni yok |

### 4.2 Admin UI'dan atama (manuel alternatif)

1. Settings → **Users** → kullanıcı seç
2. **Roles** sekmesi → `Finance` rolünü ekle
3. Super admin rolünü test kullanıcısından **çıkar** (negatif test için)

### 4.3 Finance kullanıcısı ne görür?

| Yapabilir | Yapamaz |
|-----------|---------|
| Sol menü → **Revenue** | App oluşturma/silme |
| Pano, overview, apps listesi (read) | Sync tetikleme |
| Gider ekleme / silme | Entegrasyon credentials |
| Org-scoped veri (header org seçili) | Başka org verisi |

### 4.4 Negatif test checklist (#0008)

- [x] Finance **olmayan** kullanıcı → `/revenue` → guard / 403 *(service-layer: `hasPermission` verify script)*
- [x] Finance kullanıcısı → revenue read izni var
- [x] Finance kullanıcısı → `expense:create` izni var
- [x] Finance kullanıcısı → `revenue:update` (sync) **yok** → 403 beklenir
- [ ] Dashboard UI: Revenue menüsü + pano *(manuel: `finance@helm.local`)*
- [ ] Super admin → hepsi OK *(manuel: `admin@helm.local`)*

Otomatik doğrulama:

```bash
cd helm && npx medusa db:migrate:scripts
# verify-onboarding-pilot.js — Finance RBAC + tenant isolation assert
```

---

## 5. Çoklu organizasyon doğrulama (#0009)

Pilot: iki şirket, veri sızıntısı yok.

### Otomatik seed (önerilen)

```bash
cd helm && npx medusa db:migrate:scripts
# seed-isolation-pilot.js + verify-onboarding-pilot.js
```

| Alan | Değer |
|------|-------|
| Pilot kullanıcı | `pilot@helm.local` / `pilotsecret123` |
| Org Acme | `tenant_acme` (slug: `acme`) |
| Org Beta | `tenant_beta` (slug: `beta`) |
| Acme verisi | App “Acme Game”, gider, content, CMS `acme-web` |
| Beta verisi | App “Beta App”, gider, content, CMS `beta-web` |

`pilot@helm.local` ve `admin@helm.local` her iki org'da **admin** üye.

### Kurulum (manuel alternatif)

1. Org **Acme** + Org **Beta** oluştur
2. Aynı kullanıcıyı her iki org'a **admin** üye yap
3. Acme seçili → revenue app “Acme Game” + gider ekle
4. Beta seçili → revenue app “Beta App” + farklı gider
5. Acme'ye dön → sadece Acme verisi

### Doğrulama (org switch)

- [x] Service-layer: Acme scope yalnız Acme kayıtları *(verify script)*
- [x] Service-layer: Beta scope yalnız Beta kayıtları *(verify script)*
- [ ] Header Acme → yalnız Acme kayıtları *(UI — `pilot@helm.local`)*
- [ ] Header Beta → yalnız Beta kayıtları *(UI)*
- [ ] Switch sonrası sayfa yenileme gerekmez *(UI)*

### Doğrulama yüzeyleri

| Modül | Route | Beklenen |
|-------|-------|----------|
| Revenue | `/revenue` | Org-scoped P&L |
| Content | `/content` | Org-scoped items |
| CMS | `/cms` | Org-scoped sites |
| Takım | `/settings/organization/members` | Sadece aktif org üyeleri |

### Teknik not

İzolasyon iki katman:

1. **App:** `x-tenant-id` → query filter + `tenantMismatch` → 404
2. **DB:** Postgres RLS (`levios_app` rolü + `app.current_tenant_id`) — prod connection'da devreye girer

---

## 6. Yol haritası (onboarding sonrası)

| Sıra | İş | Task | Kullanıcıya etkisi |
|------|-----|------|-------------------|
| 1 | Finance rol pilot | [#0008](../tasks/0008-rbac-finance-pilot.md) | İlk kısıtlı rol şablonu |
| 2 | İki org kanıtı | [#0009](../tasks/0009-tenant-isolation-proof.md) | Ajans / holding modeli güveni |
| 3 | Per-tenant RBAC | [#0007](../tasks/0007-per-tenant-rbac.md) | Aynı kişi Acme'de finance, Beta'da content |
| 4 | Plan / entitlement | [#0006](../tasks/0006-entitlements-composable-panel.md) | Free vs Pro modül kapısı |
| 5 | Commerce scope | [#0005](../tasks/0005-tenant-id-rls-rollout.md) | Ürün/sipariş tenant modeli |

---

## 7. Destek — sık sorular

**“Failed to fetch” login'de**  
→ Backend (`helm npm run dev`, port 9000) kapalı veya CORS yanlış.

**Organizasyon menüsü görünmüyor**  
→ Settings sidebar; customize modunda section gizlenmiş olabilir → “Customize settings sidebar” ile geri aç.

**Revenue boş ama veri var**  
→ Header'da yanlış org seçili veya kullanıcıda `revenue:read` yok.

**Her şeyi görüyorum, kısıt yok**  
→ `role_super_admin` atanmış; test için ayrı kullanıcı + Finance rolü kullan.

**Roller sekmesi yok**  
→ `MEDUSA_FF_RBAC=true` değil veya kullanıcıda `rbac_role:read` yok.

---

## 8. Onboarding tamamlandı sayılır

- [ ] Admin giriş yapabiliyor
- [ ] En az bir org oluşturuldu, takıma üye eklendi
- [ ] Finance rolü atanmış test kullanıcısı revenue + gider kullanabiliyor
- [ ] Finance olmayan kullanıcı revenue'ya erişemiyor
- [ ] İki org arasında veri karışmıyor
- [ ] Operasyon ekibi bu dokümanı pilot müşteriye uyarlayabiliyor

**Sonraki adım:** [#0008](../tasks/0008-rbac-finance-pilot.md) checklist'ini kapat → [#0007](../tasks/0007-per-tenant-rbac.md) geliştirmeye geç.
