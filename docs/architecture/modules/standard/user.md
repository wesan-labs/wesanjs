# user — Admin personeli ve kullanıcı yönetimi   [✅ upstream Medusa]

## Ne yapar
Medusa yönetim panelini kullanan admin/staff kullanıcılarını ve onların durumlarını yönetir.

## Ana modeller / kavramlar
- **User** — admin/staff kullanıcısı (email, first_name, last_name, status, metadata).

## Public yüzey (özet)
`createUsers`, `updateUsers`, `listUsers`, `retrieveUser`.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
Rol-bazlı erişim (`rbac` modülü) ve çok-kiracılık (`tenant` membership) bu modülle ilişkilendirilir.
