# #0007 — Per-tenant RBAC (Medusa rbac wire)

| | |
|---|---|
| **Durum** | 📋 Backlog (#0004 ile paralel ilerleyebilir) |
| **Öncelik** | Orta-Yüksek |
| **Etiketler** | multi-tenant · rbac · auth |
| **Bağımlı** | #0004 |
| **Karar** | ADR-0001 |

## Amaç
Per-tenant roller (admin / yönetici / sosyal-medya-uzmanı / yazılımcı …). Sıfırdan yazma
— Medusa'nın **`@medusajs/rbac`**'i zaten var (`RbacRole` + `RbacPolicy{resource,operation}`
+ rol kalıtımı); auth + modül taksonomisine bağla.

## Kapsam
- [ ] `@medusajs/rbac` modülünü helm config'e ekle + migrate
- [ ] **Resource taksonomisi:** her modül/plugin = resource namespace; operation = read/write/publish/delete/...
- [ ] **Varsayılan roller** (tenant kurulunca seed): admin (hepsi), yönetici (çoğu, sil hariç), sosyal-uzman (social/content), yazılımcı (geniş + ayarlar)
- [ ] **Atama tenant-içi:** `TenantMembership.role` (#0004) ↔ RbacRole
- [ ] **AuthZ guard:** route'larda resource+operation kontrolü (entitlement #0006 ile birlikte)
- [ ] (Sonra) bağlam-bağımlı kurallar için ABAC katmanı (Cerbos/OPA) — sadece gerekirse

## Bitti sayılır
- [ ] Sosyal-uzman kullanıcı revenue'ya erişemiyor (403); social/content'e erişiyor
- [ ] Rol değişimi anında yetkiyi değiştiriyor (micromanage permission yok)
- [ ] Roller tenant-scoped (A'daki admin, B'de hiçbir şey)
