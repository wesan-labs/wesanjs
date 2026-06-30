# auth — Kimlik doğrulama ve oturum yönetimi   [✅ upstream Medusa]

## Ne yapar
Farklı kimlik doğrulama sağlayıcılarını (e-posta/şifre, OAuth, vb.) soyutlar ve kullanıcı/müşteri oturum doğrulaması, şifre sıfırlama ve güvenli actor (yetki sahibi) eşleştirmelerini yönetir.

## Ana modeller / kavramlar
- **AuthIdentity** — kimlik doğrulaması yapılmış varlık (provider_metadata, user_metadata, app_metadata).
- **AuthProvider** — etkin kimlik doğrulama sağlayıcısı (örn. `emailpass`, `google`).

## Public yüzey (özet)
`authenticate` (kimlik doğrulama), `register` (kayıt), `validate` (token doğrulama), `retrieveAuthIdentity`, `listAuthIdentities`.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
