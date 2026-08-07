# platform-model — Ürün modeli, tam stack ve boşluklar (v0, review'e açık)

> Bu doküman **ne satıyoruz, neyle teslim ediyoruz, hangi parça eksik** sorularını tek yerde tutar.
> Teknik katman haritası: [control-plane](../architecture/control-plane.md) ·
> Dikey/yetenek katalogu: [SECTOR-SETS-SPEC](SECTOR-SETS-SPEC.md) ·
> Ürün sırası kararı: [ADR-0004](../adr/0004-product-sequence-composable-panel.md)

---

## 1. Vaat — sattığımız şey zaman

Konumlandırma **"ucuz Shopify" değil**. Bugün bir işletme AI araçlarıyla kendi panelini/mağazasını
kurmaya çalışıp aylarca kaybediyor. Vaadimiz: *kurmuyorsun, çalışır halde alıyorsun.*

Bu, ADR-0004'teki A4 composer vaadinin aynısı: sohbet → provisioning workflow → hazır panel.
Yani ürün fikri zaten kararda yazılı; bu doküman etrafındaki stack'i tamamlıyor.

**Hedef kitle iki katmanlı:**
- **Bizim geliştiricilerimiz** — sektör setleri ve yetenek paketleri yazan iç ekip. Dış geliştirici YOK (bugün).
- **Tenant'lar (işletmeler)** — paneli ve mağazayı kullanan müşteri.

---

## 2. Durum — dürüst envanter

| Katman | Bileşen | Durum |
| :--- | :--- | :---: |
| **Kontrol düzlemi** | signup/davet · composer · tenant provisioning | ✗ |
| | entitlement (plan + feature gate) · metering (kullanım sayacı) | ✗ |
| | faturalama / abonelik | ✗ |
| **Satış yüzeyleri** | storefront (çok-kiracılı + domain yönlendirme) | ✗ |
| | WhatsApp commerce · Instagram commerce | ~ |
| | pazaryeri (Trendyol · Hepsiburada · N11) | ✗ |
| **Ticaret çekirdeği** | Medusa 2.18 fork — ürün/sipariş/sepet/ödeme | ✓ |
| | multi-tenant RLS | ~ |
| | RBAC | ~ |
| **Sektör setleri** | mobilya (begahome kanıtı) · diğer dikeyler | ~ |
| **Yetenek paketleri** | content/3D stüdyo · analytics · loyalty · cms · mail · revenue | ✓ |
| **İşletme altyapısı** | kuyruk + worker (BullMQ) | ✓ |
| | observability · yedekleme · deploy pipeline | ~ |

✓ var · ~ kısmi/uykuda · ✗ yok

**Kanıt notları:**
- RLS: policy'ler yazılı ama `set_config` hiç çağrılmıyor → uykuda (#0014 Slice 2).
- WhatsApp/Instagram: `wesan-labs/levios` reposunda **kaynak var** (`packages/modules/whatsapp-commerce`,
  `instagram-commerce` + `providers/whatsapp-business`, `instagram-business`). begahome bunlara bağlıydı,
  dev aşamasında kalmış. wesanjs'e port edilmedi.
- Kuyruk: [ADR-0005](../adr/0005-background-jobs-queue-worker.md) ile kuruldu, 45 workflow + 4 cron kalıcı.

---

## 3. İki maliyet eğrisi — modelin belkemiği

Kurduğumuz şey tek iş değil, **maliyet yapısı zıt iki iş**:

```
TİCARET                              AI ÜRETİM
marjinal maliyet ≈ 0                 marjinal maliyet = gerçek para
Postgres satırı + biraz CPU          her çağrı ölçülebilir COGS
→ DÜZ ABONELİK doğru                 → DÜZ ABONELİK yanlış
öngörülebilir, yüksek marj           kullanımla marj çöker
```

**Kural:** ticaret tabanı düz abonelikle, AI yetenekleri **kredi/metering** ile satılır.
Düz ücretli AI paketinde güç kullanıcı marjı yakar, ortalama kullanıcı sübvanse etmeye yetmez.

**Ölçülmüş referans:** 3D stüdyo tam paketi COGS ≈ **$1.5–2.5/ürün**
([2026-07-08-3d-studio-pricing](../superpowers/specs/2026-07-08-3d-studio-pricing.md)).
Fiyat kartı **tahminle değil, ilk gerçek run'ların faturasından okunan COGS ile** kilitlenir.
Rakamlar bu dokümanda kasıtlı olarak yok — model burada, fiyat ölçümle gelir.

**Marj kaldıracı — yerel rekonstrüksiyon:** GLB üretimi ödemeli AI-3D yerine lokal pycolmap ile
yapılabiliyor (kanıtlandı). Ödemeli servis ~$0.4–0.8/ürün iken lokal maliyet kendi worker'ımızın
CPU zamanı. Bu, ADR-0005'in worker ayrımını gerektiriyor — kuyruk kararı aynı zamanda bir marj kararı.

---

## 4. Teslimat modeli — npm mi Docker mı

Kitleye göre farklı birim:

| Kitle | Birim | Yayın gerekiyor mu |
| :--- | :--- | :--- |
| İç geliştiriciler | monorepo + workspace linki | **Hayır** |
| Tenant'lar | tek Docker image, çok-kiracılı runtime | Hayır (image) |
| Sektör setleri / yetenek paketleri | repo içi plugin | Hayır |
| İleride dış ekipler | `@wesanjs/*` npm | Evet — **A4 sonrası** |

**Kilit ekonomik kısıt: tek image, N tenant.** Tenant başına ayrı deployment altyapı maliyetini
10–20 kat artırır ve hangi fiyat olursa olsun modeli çökertir. [ADR-0001](../adr/0001-multi-tenancy.md)
paylaşımlı multi-tenant kararı bu yüzden doğruydu. **Aynı kısıt storefront için de geçerli** ve orası
henüz yok — her mağazaya ayrı Next.js deploy edilemez.

### 4.1 npm yayını — kaynağı yeniden adlandırma YASAK

Paketleri kendi adımızla yayınlamak istiyorsak yol **yayın-anı dönüşümü**, kaynak yeniden adlandırma değil.

```
KAYNAKTA yeniden adlandırma            YAYIN ANINDA dönüşüm
4.249 dosya · 9.951 geçiş değişir      kaynak @medusajs/* kalır
merge çakışma yüzeyi 18 → 652 dosya    merge yüzeyi değişmez (18)
→ merge acı verir → fork donar         → hem kendi ad, hem upstream akışı
```

**Kanıt:** `wesan-labs/levios` tam da bunu yaptı — kaynakta `@wesan-labs/levios-*`, `@medusajs`
izi sıfır. Sonuç: **2.13.1'de donmuş** (Medusa bugün 2.18.0), terk edilmiş, begahome 5 minor sürüm geride.

Yayın pipeline'ının en riskli kısmı **598 subpath referansı** (`@medusajs/medusa/auth` gibi) —
bunlar çalışma anında okunan string'ler; dönüşüm import'ları değil string literal'leri de kapsamalı,
yoksa build geçer runtime patlar. Dönüşüm sonrası smoke test şart.

---

## 5. Türkiye pazarı — giriş bileti olan parçalar

Bunlar "özellik" değil, TR'de panelin **kullanılabilir olma şartı**. Hiçbiri bugün yok:

| Parça | Neden zorunlu |
| :--- | :--- |
| **e-Fatura / e-Arşiv** | Yasal zorunluluk. Entegrasyonu olmayan panel TR'de kullanılamaz |
| **Pazaryeri** (Trendyol · Hepsiburada · N11) | TR'de satıcı aynı anda pazaryerinde de satar. Tek panelden stok/fiyat/sipariş senkronu |
| **Kargo** (Yurtiçi · Aras · MNG · Sürat) | Barkod, takip, iade — günlük operasyonun yarısı |
| **Yerel ödeme** (İyzico · PayTR · Param) | Taksitli ödeme TR'de kritik; Stripe tek başına yetmez |
| **KVKK** | Multi-tenant'ta işleme kaydı, silme hakkı. RLS'i uyandırmanın (#0014) hukuki karşılığı |

▎WhatsApp + pazaryeri + e-fatura + kargo dörtlüsü, ürünü "Medusa'yı Türkçeleştirdim"den
"TR'de gerçekten kullanılabilir açık-kaynak tabanlı panel"e çevirir. Rakipler (İkas, Ticimax)
burada güçlü; Shopify zayıf. Farkın burada.

---

## 6. Sıralama — ADR-0004 kuyruğu + bir ekleme

ADR-0004'ün kilitli kuyruğu geçerli. Tek önerilen ekleme **A3.5**:

```
A1    güvenlik/RLS (#0014)       ← her şeyin altında, başlamadı
A2    entitlement + metering      ← "ek paket satmak" bunsuz İMKÂNSIZ
A3    ikinci sektör seti
A3.5  SATIŞ KANALI (öneri)        ← WhatsApp/Instagram portu
A4    signup + composer           ← ilk müşteri buradan gelir
KAPI  A5 core tenant-scoping (#0005)
B     storefront (çok-kiracılı) + pazaryeri + e-fatura + kargo
```

**A3.5 gerekçesi:** sektör seti = aynı ürünü başka dikeye satmak. Satış kanalı = ürünü rakipten
ayıran şey. Kaynağı elimizde (levios), begahome'da dev aşamasına gelmiş. İkinci setten önce gelmesi
öneriliyor — **karar verilmedi**.

**Entitlement neden A2'de kalmalı:** bugün hangi tenant'ın neye hakkı olduğunu bilen katman yok,
kredi sayan sayaç yok. Bu ikisi olmadan ne ticaret tabanı korunabilir ne AI kredisi satılabilir.
Metering için mimari hazır (descriptor'dan op-bazlı sayaç), yazılmamış.

---

## 7. Açık kararlar

1. **A3.5 kuyruğa girsin mi?** WhatsApp/Instagram portu ikinci setin önüne alınsın mı?
2. **npm scope adı** — `@wesanjs/*` mi? (bir plugin zaten `@wesanjs/mail-plugin`)
   Ana paket `@medusajs/medusa` → `@wesanjs/core` mü `@wesanjs/medusa` mi? 598 subpath buna bağlı.
3. **Yayın A4'e ertelensin mi?** Ertelenirse `@wesanjs/*` bugün monorepo içinde kullanılmaya başlanır, sıfır yükle.
4. **TR entegrasyonları hangi fazda?** Hepsi B'de mi, yoksa e-fatura A4'e mi çekilmeli
   (ilk gerçek müşteri fatura kesecek)?
5. **begahome ne olacak?** Ürün verisi göçü mü, kod göçü mü, olduğu yerde mi kalacak?
   (Ürünler DB'de; repodaki kataloglarda fiyat/varyant yok.)

---

## 8. İlgili

[ADR-0001](../adr/0001-multi-tenancy.md) izolasyon ·
[ADR-0004](../adr/0004-product-sequence-composable-panel.md) ürün sırası + kompoze panel ·
[ADR-0005](../adr/0005-background-jobs-queue-worker.md) kuyruk + worker ·
[SECTOR-SETS-SPEC](SECTOR-SETS-SPEC.md) dikey/yetenek katalogu ·
[control-plane](../architecture/control-plane.md) teknik katmanlar ·
[identity-and-tenancy](../architecture/identity-and-tenancy.md) kimlik + izolasyon durumu ·
tasks/0006 entitlement · tasks/0014 güvenlik temeli
