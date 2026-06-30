# digital-delivery — Dijital Ürün Teslimat & Lisans Modülü   [🔮 Planlanan]

## Amaç
İndirilebilir dijital dosyaların (PDF, yazılım, e-kitap vb.) güvenli teslimatını, geçici indirme linkleri (Signed-URL) oluşturulmasını, indirme limitlerinin takibini ve lisans anahtarlarının yönetimini sağlar.

## Neden gerek (sektör boşluğu)
Sistem fiziksel mal kargolama varsayımıyla çalışır; dijital ürün satın alındığında anında güvenli indirme linki üretme, indirme limitlerini kısıtlama ve dinamik lisans anahtarı üretme işlevleri standartta yoktur.

## Önerilen veri modeli
- **DigitalAsset** — indirilebilir dijital varlık (variant_id, file_key, download_limit, expires_after_days).
- **LicenseKey** — lisans anahtarı havuzu (variant_id, key, status: `active` | `used` | `revoked`, order_id).
- **AssetDownload** — indirme geçmişi (customer_id, asset_id, ip_address, downloaded_at).

## Açtığı dikeyler (+ kaç dikey)
Dijital ürün satışı dikeyi.

## Efor (S/M/L + gerekçe)
M (Orta): Güvenli geçici dosya linki üretimi (S3/Cloudflare R2 imzalı URL'leri) ve indirme limit kontrolü orta eforludur.

## Bağımlılıklar
`file`, `order`.

## Durum: 🔮 Planlanan — henüz başlanmadı
