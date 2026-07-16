# #0006 — Entitlements + müşteri-kompoze panel (mağaza)

| | |
|---|---|
| **Durum** | 📋 Backlog (#0004-5'ten sonra) |
| **Öncelik** | Orta-Yüksek (vizyonun kalbi) |
| **Etiketler** | multi-tenant · entitlements · panel |
| **Bağımlı** | #0004, #0005 |
| **Karar** | ADR-0001 · ADR-0004 (A2) |

## Amaç
"Müşteriler mağazadan modül seçip kendi panelini kurar" — **always-on modüller +
per-tenant entitlement**, per-tenant modül yükleme DEĞİL (boot-duvarı).

**Tüketiciler:** (1) sidebar filtresi = RBAC ∩ entitlement, iki-zone modeliyle
(main=dikey, Extensions=yetenek — [SECTOR-SETS-SPEC](../specs/SECTOR-SETS-SPEC.md));
(2) **AI composer** (ADR-0004 A4) mağazanın konuşan yüzü: intent → buradaki "kur"
akışını çağırır, yeni mekanizma icat etmez.

## Kapsam
- [ ] **Entitlement modülü:** `tenant_id, module_key, enabled, plan, limits, config`
- [ ] **Modül kataloğu** ("mağaza"): kurulabilir modüller (e-commerce/crm/revenue/social/cms/content/...) + meta
- [ ] **"Kur" akışı:** entitlement satırı + varsayılan rol policy'leri (RBAC #0007)
- [ ] **Entitlement guard** (request anında): erişilen modül tenant'a entitled mı → allow/limit/deny
- [ ] **Per-tenant panel config:** sidebar tenant'ın entitled modüllerini render eder (statik 9-item değil)
- [ ] (Sonra) plan/limit + billing event entegrasyonu

## Bitti sayılır
- [ ] İki tenant farklı modül setine sahip → sidebar'ları farklı
- [ ] Entitled olmayan modülün API'si 403; UI'da görünmüyor
- [ ] Mağazadan "kur" → modül tenant panelinde belirir
