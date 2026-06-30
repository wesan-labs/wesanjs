# api-key — API anahtarları (Publishable / Secret) yönetimi   [✅ upstream Medusa]

## Ne yapar
Yayınlanabilir (client-side/publishable) ve gizli (admin/secret) API anahtarlarını, bunların durumlarını, iptal (revoke) süreçlerini ve son kullanım tarihlerini yönetir.

## Ana modeller / kavramlar
- **ApiKey** — API anahtarı kaydı (token, type: `publishable` | `secret`, status, last_used_at, created_by).

## Public yüzey (özet)
`createApiKeys`, `updateApiKeys`, `listApiKeys`, `retrieveApiKey`, `revokeApiKey`. Client isteklerini doğrulamak için publishable key çözme ve yetkilendirme katmanları bu modülü kullanır.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
