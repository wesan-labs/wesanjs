# workflow-engine — İş akışları ve mutasyon yönetimi   [✅ upstream Medusa]

## Ne yapar
Rollback (geri alma/compensation) yeteneklerine sahip karmaşık iş akışlarını (workflows) yönetir. Hata durumunda adımların geri alınmasını sağlayarak sistemin tutarlı bir durumda kalmasını (transactional consistency) garantiler. InMemory ve Redis tabanlı yürütücüleri vardır.

## Ana modeller / kavramlar
- **WorkflowExecution** — iş akışı yürütüm kaydı (workflow_id, transaction_id, state, steps, status).

## Public yüzey (özet)
Workflows register (iş akışı kaydetme), execution (yürütme), rollback (geri alma), durum sorgulama.

## Durum
✅ Upstream Medusa core — fork'ta mevcut (özel durum denetimi yapılmadı; değiştirilmediyse upstream ile aynı).

## Not
—
